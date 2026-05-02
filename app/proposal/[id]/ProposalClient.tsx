"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther } from "../../../lib/currencyUtils";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { supabase } from "../../../lib/supabase";
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

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const proposalId = Number(idParam);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: proposal, isLoading: proposalLoading } = useProposal(proposalId);
  const { data: activity = [] } = useProposalActivity(proposalId);
  const { data: fundings = [] } = useProposalFundings(proposalId);

  const metadata = useProposalMetadata(proposal?.metadataURI);

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

  const myContribution = useMemo(() => {
    if (!wallet.address || !fundings.length) return "0";
    const mine = fundings
      .filter(
        (f) => f.supporter?.toLowerCase() === wallet.address?.toLowerCase()
      )
      .reduce((acc, f) => acc + BigInt(f.amount), 0n);
    return formatEther(mine);
  }, [wallet.address, fundings]);

  useEffect(() => {
    if (!proposalId) return;

    const channel = supabase
      .channel(`proposal-detail-${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
          filter: `id=eq.${proposalId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) })
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fundings",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: [...proposalKeys.detail(proposalId), "fundings"] })
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: [...proposalKeys.detail(proposalId), "activity"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId, queryClient]);

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

    await fundMutation.mutateAsync({
      proposalId,
      asset: proposal.asset,
      amount: fundAmount,
    });
    setFundAmount("");
  }

  async function handleFinalize() {
    if (!wallet.connected) {
      toast.error(t.conectWallet);
      return;
    }

    await finalizeMutation.mutateAsync(proposalId);
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

    await withdrawMutation.mutateAsync(proposalId);
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

  if (proposalLoading && !proposal) {
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
      <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25">
        <AppHeader />
        <div className="flex h-[70vh] items-center justify-center p-8">
          <div className="text-center">
            <EmptyState 
              title={t.proposalNotFoundPage} 
              description="This proposal doesn't exist or has been removed."
            />
            <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-500 hover:text-cyan-400">
              <ArrowLeft size={16} /> {t.backToHome}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const status = normalizeStatus(proposal.status);
  const goal = Number(proposal.goal);
  const raised = Number(proposal.totalRaised);
  const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  const threshold = Number(proposal.minThreshold);
  const thresholdPercent = goal > 0 ? Math.min((threshold / goal) * 100, 100) : 0;

  const isExpired = hasExpired(proposal.deadline);
  const isActive = status === "active";
  const canFund = wallet.connected && isActive && !isExpired;
  
  const canFinalize = wallet.connected && isActive && isExpired; 
  const canWithdraw = wallet.connected && status === "failed" && Number(myContribution) > 0;

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
    { id: "created", label: "Created", icon: FileText, done: true, color: "text-blue-400", bg: "bg-blue-500/20" },
    { id: "funding", label: "Funding", icon: Coins, done: percent > 0 || status === 'active', color: "text-cyan-400", bg: "bg-cyan-500/20" },
    { id: "threshold", label: "Consensus", icon: Target, done: percent >= thresholdPercent, color: percent >= thresholdPercent ? "text-cyan-400" : "text-amber-400", bg: percent >= thresholdPercent ? "bg-cyan-500/20" : "bg-amber-500/20" },
    { id: "finished", label: status === 'succeeded' ? "Unlocked" : status === 'failed' ? "Failed" : "Finalized", icon: status === 'failed' ? XCircle : CheckCircle2, done: status !== 'active', color: status === 'failed' ? "text-rose-400" : status === 'succeeded' ? "text-cyan-400" : "text-muted-foreground", bg: status === 'failed' ? "bg-rose-500/20" : status === 'succeeded' ? "bg-cyan-500/20" : "bg-secondary" }
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

                <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl leading-[1.15]">
                  {metadata.title}
                </h1>

                <p className="mt-6 text-base leading-relaxed text-muted-foreground/90 md:text-lg">
                  {metadata.description}
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
                <h3 className="text-lg font-bold text-foreground mb-6">Proposal Lifecycle</h3>
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
                        <>{t.supp} Proposal</>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-muted-foreground/60 font-medium">Funds are securely locked in smart contract escrow.</p>
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

                {status === "failed" && Number(myContribution) <= 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-background/40 p-4 text-center text-xs font-semibold text-muted-foreground">
                    {t.noFundsToWithdraw}
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
                    {t.conectWallet} to interact.
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