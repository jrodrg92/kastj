"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { formatUnits } from "../../../lib/currencyUtils";
import toast from "react-hot-toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { supabase } from "../../../lib/supabase-client";
import { useWalletContext } from "../../../contexts/WalletContext";
import { useUi } from "../../../contexts/UiContext";
import { useProposalEngine } from "../../../hooks/useProposalEngine";
import { NETWORK } from "../../../lib/network";
import {
  formatRemainingTime,
  isExpired as hasExpired,
} from "../../../lib/time";
import { AppHeader } from "../../../components/layout/AppHeader";
import { InfoTooltip } from "../../../components/ui/InfoTooltip";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ScrollReveal } from "../../../components/ui/ScrollReveal";
import { History, ChevronDown, ArrowLeft, Loader2, FileText, Coins, Target, CheckCircle2, XCircle } from "lucide-react";
import { ProposalMessages } from "../../../components/proposal/ProposalMessages";

import { useFundProposal } from "../../../features/proposals/hooks/useFundProposal";
import { useFinalizeProposal } from "../../../features/proposals/hooks/useFinalizeProposal";
import { useWithdrawProposal } from "../../../features/proposals/hooks/useWithdrawProposal";
import { useProposal } from "../../../features/proposals/hooks/useProposal";
import { useProposalActivity } from "../../../features/proposals/hooks/useProposalActivity";
import { useProposalFundings } from "../../../features/proposals/hooks/useProposalFundings";
import { proposalKeys } from "../../../features/proposals/queryKeys";

import { useProposalMetadata } from "../../../features/proposals/hooks/useProposalMetadata";

import { 
  short, 
  normalizeStatus, 
  statusLabel 
} from "../../../lib/proposalUtils";

function activityIcon(type: string) {
  if (type === "created") return "🆕";
  if (type === "funded") return "💸";
  if (type === "succeeded") return "✅";
  if (type === "failed") return "❌";
  return "•";
}

export default function ProposalClient() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const wallet = useWalletContext();
  const { t } = useUi();
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);

  const id = params?.id;
  const proposalId = Number(id);
  const searchParams = useSearchParams();
  const txFromUrl = searchParams.get('tx');

  const { data: proposal, isLoading: isProposalLoading } = useProposal(proposalId);
  // Redirección basada en ID de URL (Negativo = Pendiente)
  const isPending = proposalId < 0;

  // 1. Listener de Redirección (Realtime)
  useEffect(() => {
    const txHash = (proposal?.tx_hash || txFromUrl)?.toLowerCase();
    if (!isPending || !txHash) return;

    const channel = supabase
      .channel(`sync-${txHash}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals", filter: `tx_hash=eq.${txHash}` },
        (payload) => {
          const newProposal = payload.new as any;
          // Si detectamos que ya tiene un ID real (>0), redirigimos
          if (newProposal && Number(newProposal.id) > 0) {
            router.replace(`/proposal/${newProposal.id}`);
            // Fallback agresivo para asegurar que el navegador cambie de página
            setTimeout(() => { 
              if (window.location.pathname.includes(id as string)) {
                window.location.href = `/proposal/${newProposal.id}`;
              }
            }, 500);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isPending, proposal?.tx_hash, txFromUrl, router, id]);

  // 2. Polling de Redirección (Fallback)
  const lastKnownTxHash = useRef<string | null>(txFromUrl?.toLowerCase() || null);
  const lastKnownMetadataUri = useRef<string | null>(null);
  if (proposal?.tx_hash) lastKnownTxHash.current = proposal.tx_hash.toLowerCase();
  if (proposal?.metadataURI) lastKnownMetadataUri.current = proposal.metadataURI;

  useEffect(() => {
    if (!isPending) return;
    const checkInterval = setInterval(async () => {
      const hash = lastKnownTxHash.current;
      const uri = lastKnownMetadataUri.current;
      if (!hash && !uri) return;
      const { data } = await supabase.from("proposals").select("id").gt("id", 0).or(`tx_hash.eq.${hash},metadata_uri.eq.${uri}`).maybeSingle();
      if (data?.id) {
        router.replace(`/proposal/${data.id}`);
        setTimeout(() => { if (window.location.pathname.includes(id as string)) window.location.href = `/proposal/${data.id}`; }, 1500);
      }
    }, 3000);
    return () => clearInterval(checkInterval);
  }, [isPending, id, router]);

  // 3. Sistema de Reactividad Total (Realtime)
  useEffect(() => {
    if (isPending || proposalId <= 0) return;

    const channel = supabase
      .channel(`proposal-room-${proposalId}`)
      // Escucha cambios en la propuesta (progreso, estado, etc)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals", filter: `id=eq.${proposalId}` },
        () => { queryClient.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) }); }
      )
      // Escucha nuevas aportaciones y RETIROS (marcar como withdrawn)
      .on("postgres_changes", { event: "*", schema: "public", table: "fundings", filter: `proposal_id=eq.${proposalId}` },
        () => { 
          queryClient.invalidateQueries({ queryKey: ["fundings", proposalId] });
          queryClient.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) });
        }
      )
      // Escucha actividad reciente
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity", filter: `proposal_id=eq.${proposalId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["activity", proposalId] }); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isPending, proposalId, queryClient]);

  // Data & Metadata
  const metadata = useProposalMetadata(proposal?.metadataURI);

  const displayMetadata = useMemo(() => {
    if (proposal) return { title: metadata.title || proposal.title, description: metadata.description || proposal.description };
    return { title: "Cargando...", description: "" };
  }, [proposal, metadata]);

  const { data: activity = [] } = useProposalActivity(proposalId);
  const { data: fundings = [] } = useProposalFundings(proposalId);

  // Feature hooks for mutations
  const fundMutation = useFundProposal(ctx);
  const finalizeMutation = useFinalizeProposal(ctx);
  const withdrawMutation = useWithdrawProposal(ctx);

  const isMutating =
    fundMutation.isPending ||
    finalizeMutation.isPending ||
    withdrawMutation.isPending;

  const [fundAmount, setFundAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [isActivityExpanded, setIsActivityExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasWithdrawn = useMemo(() => {
    if (!wallet.address || !fundings.length) return false;
    return fundings.some(
      (f) => 
        f.supporter?.toLowerCase() === wallet.address?.toLowerCase() &&
        f.withdrawn
    );
  }, [wallet.address, fundings]);

  const myContribution = useMemo(() => {
    if (!wallet.address || !fundings || !proposal) return "0";
    const mine = fundings
      .filter((f) => 
        f.supporter.toLowerCase() === wallet.address?.toLowerCase() &&
        !f.withdrawn
      )
      .reduce((sum, f) => sum + BigInt(f.amount), 0n);
    
    const decimals = proposal.asset.decimals;
    return formatUnits(mine, decimals);
  }, [wallet.address, fundings, proposal]);

  async function handleFund() {
    if (!wallet.connected) {
      toast.error(t.conectWallet);
      return;
    }

    if (!proposal) {
      toast.error(t.proposalNotFound);
      return;
    }

    if (Number(fundAmount) <= 0) {
      toast.error(t.invalidAmount);
      return;
    }

    try {
      const result = await fundMutation.mutateAsync({
        proposalId,
        asset: proposal.asset,
        amount: fundAmount,
      });

      if (result?.txId) {
        // FAST PATH: Registro inmediato como pendiente
        await fetch("/api/tx/pending", {
          method: "POST",
          body: JSON.stringify({
            hash: result.txId,
            type: "fund_proposal",
            payload: { proposalId, amount: fundAmount, supporter: wallet.address }
          })
        }).catch(err => console.error("Error saving pending funding:", err));

        toast.success("Aportación enviada. Confirmando...");
      }

      setFundAmount("");
    } catch (e: any) {
      if (e.code !== "ACTION_REJECTED" && e.code !== 4001) {
        console.error("Fund failed:", e);
      }
    }
  }

  async function handleFinalize() {
    if (!wallet.connected) {
      toast.error(t.conectWallet);
      return;
    }

    try {
      await finalizeMutation.mutateAsync(proposalId);
    } catch (e: any) {
      if (e.code !== "ACTION_REJECTED" && e.code !== 4001) {
        console.error("Finalize failed:", e);
      }
    }
  }

  async function handleWithdraw() {
    if (!wallet.connected) {
      toast.error(t.conectWallet);
      return;
    }

    if (Number(myContribution) <= 0) {
      toast.error(t.noFundsToWithdraw);
      return;
    }

    try {
      await withdrawMutation.mutateAsync(proposalId);
    } catch (e: any) {
      if (e.code !== "ACTION_REJECTED" && e.code !== 4001) {
        console.error("Withdraw failed:", e);
      }
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success(`${t.linkCopied} 📋`);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!Number.isFinite(proposalId)) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground flex items-center justify-center">
        <EmptyState 
          title={t.invalidProposalId} 
          description="The proposal ID provided in the URL is not valid."
        />
      </main>
    );
  }

  if (isProposalLoading && !proposal) {
    return (
      <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25">
        <AppHeader />
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1 space-y-6">
              <div className="h-64 w-full rounded-3xl premium-glass animate-shimmer" />
              <div className="h-40 w-full rounded-3xl premium-glass animate-shimmer" />
            </div>
            <div className="w-full lg:w-[380px]">
              <div className="h-96 w-full rounded-3xl premium-glass animate-shimmer" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-500" />
        <p className="mt-4 text-muted-foreground">Cargando datos de la propuesta...</p>
      </main>
    );
  }

  const status = normalizeStatus(proposal.status);
  const goalRaw = BigInt(proposal.goalRaw || "0");
  
  // Reactividad total: Sumamos los fundings en tiempo real en lugar de fiarnos del total de la tabla proposal
  const raisedRaw = fundings.reduce((sum, f) => sum + BigInt(f.amount), 0n);
  const thresholdRaw = BigInt(proposal.minThresholdRaw || "0");

  // Cálculo de porcentaje con precisión decimal
  const percent = goalRaw > 0n ? Number((raisedRaw * 10000n) / goalRaw) / 100 : 0;
  const thresholdPercent = goalRaw > 0n ? Number((thresholdRaw * 10000n) / goalRaw) / 100 : 0;

  const goal = Number(proposal.goal);
  const raised = Number(formatUnits(raisedRaw, proposal.asset.decimals));
  const threshold = Number(proposal.minThreshold);

  const isExpired = hasExpired(proposal.deadline);
  const isActive = status === "active";
  const canFund = wallet.connected && isActive && !isExpired && !isPending;
  
  const canFinalize = wallet.connected && isActive && isExpired && !isPending; 
  const canWithdraw = wallet.connected && status === "failed" && Number(myContribution) > 0 && !isPending;

  const supportersCount = new Set(
    fundings.map((f) => f.supporter?.toLowerCase())
  ).size;

  const isCreator =
    wallet.address &&
    proposal.creator?.toLowerCase() === wallet.address.toLowerCase();

  const isTrending = percent >= 80 && isActive;

  /* Semantic Styling */
  const statusBadgeClass =
    status === "active"
      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      : status === "succeeded"
        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
        : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  /* Timeline Logic */
  const timelineSteps = [
    { id: "created", label: t.lifecycleCreated, icon: FileText, done: true, color: "text-blue-400", bg: "bg-blue-500/20" },
    { id: "funding", label: t.lifecycleFunding, icon: Coins, done: percent > 0 || status === 'active', color: "text-cyan-400", bg: "bg-cyan-500/20" },
    { id: "threshold", label: t.lifecycleConsensus, icon: Target, done: percent >= thresholdPercent, color: percent >= thresholdPercent ? "text-cyan-400" : "text-amber-400", bg: percent >= thresholdPercent ? "bg-cyan-500/20" : "bg-amber-500/20" },
    { id: "finished", label: status === 'succeeded' ? t.succeededStatus : status === 'failed' ? t.failedStatus : t.lifecycleFinalized, icon: status === 'failed' ? XCircle : CheckCircle2, done: status !== 'active', color: status === 'failed' ? "text-rose-400" : status === 'succeeded' ? "text-cyan-400" : "text-muted-foreground", bg: status === 'failed' ? "bg-rose-500/20" : status === 'succeeded' ? "bg-cyan-500/20" : "bg-secondary" }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25">
      <AppHeader />
      
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        
        {/* Back Navigation */}
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} /> {t.backToProposals}
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          
          {/* ─── LEFT COLUMN: CONTENT ─── */}
          <div className="space-y-8">
            
            {/* Overview Card */}
            <ScrollReveal>
              <div className="premium-glass rounded-[2rem] p-6 md:p-10">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${statusBadgeClass}`}>
                    <div className={`h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]`} />
                    {statusLabel(status, t)}
                  </span>

                  {isCreator && (
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-500">
                      {t.youAreCreator}
                    </span>
                  )}

                  {isTrending && (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
                      🔥 {t.trending}
                    </span>
                  )}
                  
                  <span className="ml-auto text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t.proposalHash}{proposal.id}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl leading-[1.15] flex items-center flex-wrap gap-4">
                  {displayMetadata.title}
                  {isPending && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider animate-pulse">
                      <Loader2 size={10} className="animate-spin" /> Sincronizando
                    </span>
                  )}
                </h1>

                <p className="mt-6 text-base leading-relaxed text-muted-foreground/90 md:text-lg">
                  {displayMetadata.description}
                </p>

                <div className="mt-10 grid gap-4 rounded-2xl border border-white/[0.06] bg-background/40 p-5 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t.creator}:</span>
                    <span className="font-mono font-medium text-foreground">{short(proposal.creator)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t.receiver}:</span>
                    <span className="font-mono font-medium text-foreground">{short(proposal.recipient)}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Timeline Visual */}
            <ScrollReveal delay={100}>
              <div className="premium-glass rounded-3xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-foreground mb-6">{t.proposalLifecycle}</h3>
                <div className="flex items-center justify-between relative">
                  {/* Background Track */}
                  <div className="absolute left-0 top-6 h-0.5 w-full bg-white/[0.06] -z-10" />
                  
                  {timelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-3 relative px-2">
                        <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 ${step.done ? step.bg : 'bg-[#121212] text-muted-foreground/30'} transition-colors duration-500 shadow-xl`}>
                          <Icon size={20} className={step.done ? step.color : 'text-muted-foreground/30'} />
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${step.done ? 'text-foreground/90' : 'text-muted-foreground/50'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>

            {/* Trust / Features */}
            <ScrollReveal delay={200}>
              <div className="premium-glass rounded-3xl p-6 md:p-8">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  {t.whyTrust}
                  <InfoTooltip content={t.trustTooltip} />
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="group rounded-2xl border border-white/[0.06] bg-background/40 p-5 transition-all hover:bg-card hover:border-cyan-500/20">
                    <p className="text-sm font-semibold text-foreground">{t.escrowProtected}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {t.escrowProtectedDesc}
                    </p>
                  </div>
                  <div className="group rounded-2xl border border-white/[0.06] bg-background/40 p-5 transition-all hover:bg-card hover:border-cyan-500/20">
                    <p className="text-sm font-semibold text-foreground">{t.autoSettlement}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {t.autoSettlementDesc}
                    </p>
                  </div>
                  <div className="group rounded-2xl border border-white/[0.06] bg-background/40 p-5 transition-all hover:bg-card hover:border-cyan-500/20">
                    <p className="text-sm font-semibold text-foreground">{t.transparentHistory}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {t.transparentHistoryDesc}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Messages */}
            <ScrollReveal delay={300}>
              <ProposalMessages
                proposalId={String(proposalId)}
                currentWallet={wallet.address}
                creatorWallet={proposal.creator}
                recipientWallet={proposal.recipient}
              />
            </ScrollReveal>

            {/* Activity Log */}
            <ScrollReveal delay={400}>
              <div className="premium-glass rounded-3xl p-6 md:p-8 mb-8">
                <button 
                  onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                  className="flex w-full items-center justify-between group outline-none"
                >
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <History className="h-5 w-5 text-cyan-500" />
                    {t.propAct}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold text-muted-foreground">
                      {activity.length} {activity.length === 1 ? t.eventLabel : t.eventsLabel}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isActivityExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isActivityExpanded && (
                  <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {activity.length === 0 ? (
                      <div className="rounded-2xl border border-white/[0.06] bg-background/30 p-8 text-center">
                        <p className="text-sm text-muted-foreground">{t.noActivityYet}</p>
                      </div>
                    ) : (
                      <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {activity.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-background/40 p-4 transition-all hover:bg-card hover:border-cyan-500/20"
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ${
                              item.type === 'funded' ? 'bg-cyan-500/10 text-cyan-500' : 
                              item.type === 'created' ? 'bg-blue-500/10 text-blue-500' : 
                              item.type === 'failed' ? 'bg-rose-500/10 text-rose-500' : 
                              item.type === 'succeeded' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary'
                            }`}>
                              {activityIcon(item.type)}
                            </span>
        
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.message}</p>
                              <p className="mt-1 text-[11px] text-muted-foreground/60">
                                {item.actor ? short(item.actor) : t.systemActor} ·{" "}
                                {new Date(item.created_at ?? 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* ─── RIGHT COLUMN: STICKY PANEL ─── */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="premium-glass rounded-[2rem] p-6 md:p-8">
              
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                <span>{t.raisedLabel}</span>
                {isExpired ? (
                  <span className="text-rose-400">{t.expired}</span>
                ) : (
                  <span>{mounted ? formatRemainingTime(proposal.deadline) : "--"}</span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">{raised.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                <span className="text-sm font-medium text-muted-foreground">/ {goal.toLocaleString()} {NETWORK.currency}</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground uppercase tracking-wider">{t.progress}</span>
                  <span className={percent >= thresholdPercent ? 'text-emerald-400' : 'text-amber-400'}>
                    {percent.toFixed(1)}%
                  </span>
                </div>
                
                <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06] shadow-inner">
                  {/* Threshold Marker */}
                  {thresholdPercent > 0 && thresholdPercent < 100 && (
                    <div 
                      className="absolute top-0 bottom-0 z-30 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      style={{ left: `${thresholdPercent}%` }}
                      title={`${t.minThreshold}: ${thresholdPercent}%`}
                    />
                  )}
                  
                  {/* Fill */}
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      percent >= thresholdPercent 
                        ? "bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                        : "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {thresholdPercent > 0 && (
                  <div className="mt-2 text-right text-[10px] font-semibold text-muted-foreground/50">
                    {t.minThreshold}: {threshold.toLocaleString()} {NETWORK.currency}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-background/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{t.unicSup}</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{supportersCount}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-background/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{t.yourContribution}</p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {Number(myContribution).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 space-y-4">
                {isActive && !isExpired && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full rounded-xl border border-white/10 bg-background/60 p-4 pl-12 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
                        placeholder={`${t.amountPlaceholder}`}
                        value={fundAmount}
                        onChange={(event) => setFundAmount(event.target.value)}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-500">
                        {NETWORK.currency}
                      </div>
                    </div>

                    <button
                      disabled={!canFund || isMutating}
                      onClick={handleFund}
                      className="premium-btn flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold disabled:opacity-50"
                    >
                      {fundMutation.isPending ? (
                        <><Loader2 size={16} className="animate-spin" /> {t.processingButton}</>
                      ) : (
                        <>{t.supp} {proposal.asset.symbol}</>
                      )}
                    </button>
                    {isPending && (
                      <p className="text-center text-[10px] text-amber-500 font-bold animate-pulse">
                        ⌛ Esperando confirmación en blockchain para permitir aportaciones...
                      </p>
                    )}
                    <p className="text-center text-[10px] text-muted-foreground/60 font-medium">{t.escrowProtectedDesc}</p>
                  </div>
                )}

                {isActive && isExpired && (
                  <button
                    disabled={!canFinalize || isMutating}
                    onClick={handleFinalize}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {finalizeMutation.isPending ? (
                      <><Loader2 size={16} className="animate-spin" /> {t.finalizingButton}</>
                    ) : (
                      <>{t.finalizeProposalButton}</>
                    )}
                  </button>
                )}

                {status === "failed" && Number(myContribution) > 0 && (
                  <button
                    disabled={!canWithdraw || isMutating}
                    onClick={handleWithdraw}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3.5 text-sm font-bold text-rose-400 transition-all hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    {withdrawMutation.isPending ? (
                      <><Loader2 size={16} className="animate-spin" /> {t.withdrawingButton}</>
                    ) : (
                      <>{t.withdrawButton} {Number(myContribution).toLocaleString(undefined, { maximumFractionDigits: 2 })} {NETWORK.currency}</>
                    )}
                  </button>
                )}

                {status === "failed" && hasWithdrawn && Number(myContribution) <= 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-center text-xs font-bold text-emerald-400 animate-in fade-in zoom-in duration-500">
                    {t.withdrawalAlreadyDone}
                  </div>
                )}
                
                {status === "succeeded" && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-center text-xs font-bold text-emerald-400">
                    {t.fundsDistributedSuccess}
                  </div>
                )}

                <button
                  onClick={copyLink}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-semibold transition-all ${
                    copied ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 scale-[0.98]' : 'border-white/10 bg-card/50 text-foreground hover:bg-accent'
                  }`}
                >
                  {copied ? (
                    <><CheckCircle2 size={16} /> {t.linkCopied}</>
                  ) : (
                    <>🔗 {t.shareProposal}</>
                  )}
                </button>

                {!wallet.connected && (
                  <p className="text-center text-[11px] font-medium text-rose-400">
                    {t.conectWallet}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}