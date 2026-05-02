"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther } from "../../../lib/currencyUtils";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

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
import { History, ChevronDown } from "lucide-react";
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
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);

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
      <main className="min-h-screen bg-background p-8 text-foreground">
        {t.invalidProposalId}
      </main>
    );
  }

  if (proposalLoading && !proposal) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20" />
          <p className="text-muted-foreground">{t.loadingProposal}</p>
        </div>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t.proposalNotFoundPage}</h1>
          <button onClick={() => router.push('/')} className="mt-4 text-emerald-500 hover:underline">{t.backToHome}</button>
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

  const isTrending = percent >= 80;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8 selection:bg-emerald-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/5 via-background to-background"></div>
      <div className="mx-auto max-w-7xl space-y-8">
        <AppHeader />

        <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <section className="premium-glass rounded-3xl p-8 lg:p-10">
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-4 py-1.5 text-sm font-bold text-foreground shadow-sm">
                  <div className={`h-2 w-2 rounded-full ${status === "active" ? "bg-yellow-500" : status === "succeeded" ? "bg-green-500" : "bg-red-500"} shadow-[0_0_8px_currentColor]`} />
                  {statusLabel(status, t)}
                </span>

                {isCreator && (
                  <span className="flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-500 shadow-sm">
                    {t.youAreCreator}
                  </span>
                )}

                {isTrending && (
                  <span className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-sm font-bold text-orange-500 shadow-sm">
                    🔥 {t.trending}
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.proposalHash}{proposal.id}</p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-gradient md:text-5xl leading-tight pb-2">
                {metadata.title}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {metadata.description}
              </p>

              <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-background/50 p-5 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  {t.creator}:{" "}
                  <span className="font-mono text-foreground/80">{short(proposal.creator)}</span>
                </p>

                <p>
                  {t.receiver}:{" "}
                  <span className="font-mono text-foreground/80">
                    {short(proposal.recipient)}
                  </span>
                </p>

                <p>
                  {t.deadline}:{" "}
                  <span className="font-medium text-foreground/80">
                    {isExpired
                      ? t.expired
                      : formatRemainingTime(proposal.deadline)}
                  </span>
                </p>

                <p>
                  {t.suprtd}:{" "}
                  <span className="font-medium text-foreground/80">{supportersCount}</span>
                </p>
              </div>
            </section>

            <section className="premium-glass rounded-3xl p-8 lg:p-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {t.whyTrust}
                <InfoTooltip content={t.trustTooltip} />
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="group rounded-2xl border border-border bg-background/50 p-6 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <p className="font-semibold text-foreground">{t.escrowProtected}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t.escrowProtectedDesc}
                  </p>
                </div>

                <div className="group rounded-2xl border border-border bg-background/50 p-6 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <p className="font-semibold text-foreground">{t.autoSettlement}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t.autoSettlementDesc}
                  </p>
                </div>

                <div className="group rounded-2xl border border-border bg-background/50 p-6 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <p className="font-semibold text-foreground">{t.transparentHistory}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t.transparentHistoryDesc}
                  </p>
                </div>
              </div>
            </section>

            <ProposalMessages
              proposalId={String(proposalId)}
              currentWallet={wallet.address}
              creatorWallet={proposal.creator}
              recipientWallet={proposal.recipient}
            />

            <section className="premium-glass rounded-3xl p-6 lg:p-8">
              <button 
                onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                className="flex w-full items-center justify-between group"
              >
                <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-3">
                  <History className="h-6 w-6 text-emerald-500" />
                  {t.propAct}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-500 border border-emerald-500/20">
                    {activity.length} {activity.length === 1 ? t.eventLabel : t.eventsLabel}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isActivityExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isActivityExpanded && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">{t.noActivityYet}</p>
                  ) : (
                      <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {activity.map((item, index) => (
                          <div
                            key={item.id}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both flex items-start gap-4 rounded-2xl border border-border bg-background/50 p-5 transition-all hover:bg-card hover:border-emerald-500/20"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ${
                              item.type === 'funded' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 
                              item.type === 'created' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-500' : 
                              item.type === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-500' : 'bg-secondary'
                            }`}>
                              {activityIcon(item.type)}
                            </span>
        
                            <div>
                              <p className="font-medium text-foreground">{item.message}</p>
                              <p className="text-sm text-muted-foreground/80">
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
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <section className="premium-glass rounded-3xl p-8 lg:p-10">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.raisedLabel}</p>

              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tracking-tight text-foreground">{raised.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.ofLabel} {goal.toFixed(4)} {NETWORK.currency}
                  </p>
                </div>

                <p className={`text-3xl font-bold tracking-tight ${percent >= thresholdPercent ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}>
                  {percent.toFixed(1)}%
                </p>
              </div>

              <div className="relative mt-8 h-2.5 overflow-hidden rounded-full bg-secondary ring-1 ring-inset ring-black/10 dark:ring-white/5">
                {/* Milestone Marker (Threshold) */}
                {thresholdPercent > 0 && thresholdPercent < 100 && (
                  <div 
                    className="absolute top-0 bottom-0 z-30 w-[3px] bg-white shadow-[0_0_15px_rgba(255,255,255,1)] dark:bg-white"
                    style={{ left: `${thresholdPercent}%` }}
                  ></div>
                )}
                
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    percent >= thresholdPercent 
                      ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] dark:shadow-[0_0_12px_rgba(16,185,129,0.8)]" 
                      : "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)] dark:shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {thresholdPercent > 0 && (
                <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold">
                  <span>{t.minLabel} {threshold.toFixed(2)} {NETWORK.currency}</span>
                  <span>{t.goalAsideLabel} {goal.toFixed(2)}</span>
                </div>
              )}

              <div className="mt-10 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-background/50 p-5 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t.unicSup}</p>
                  <p className="mt-2 text-2xl font-black text-foreground">
                    {supportersCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-background/50 p-5 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t.status}</p>
                  <p className="mt-2 text-xl font-black capitalize text-foreground">{statusLabel(status, t).replace(/^(🟡|🟢|🔴)\s*/, "")}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-background/50 p-5 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t.yourContribution}</p>
                  <p className="mt-2 text-2xl font-black text-foreground">
                    {Number(myContribution).toFixed(4)} <span className="text-sm font-bold text-muted-foreground">{NETWORK.currency}</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {isActive && !isExpired && (
                  <>
                    <input
                      className="w-full rounded-2xl border border-border bg-background/80 p-5 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
                      placeholder={`${t.amountPlaceholder} ${NETWORK.currency}`}
                      value={fundAmount}
                      onChange={(event) => setFundAmount(event.target.value)}
                    />

                    <button
                      disabled={!canFund || isMutating}
                      onClick={handleFund}
                      className="premium-btn w-full rounded-2xl px-5 py-4 font-bold text-lg disabled:opacity-50"
                    >
                      {fundMutation.isPending
                        ? t.processingButton
                        : `${t.supp} ${fundAmount} ${NETWORK.currency}`}
                    </button>
                  </>
                )}

                {isActive && isExpired && (
                  <button
                    disabled={!canFinalize || isMutating}
                    onClick={handleFinalize}
                    className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 font-bold text-emerald-600 transition-all hover:bg-emerald-500/20 disabled:opacity-40 dark:text-emerald-400"
                  >
                    {finalizeMutation.isPending
                      ? t.finalizingButton
                      : t.finalizeProposalButton}
                  </button>
                )}

                {status === "succeeded" && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {t.fundsDistributedSuccess}
                  </div>
                )}

                {status === "failed" && Number(myContribution) > 0 && (
                  <button
                    disabled={!canWithdraw || isMutating}
                    onClick={handleWithdraw}
                    className="w-full rounded-2xl bg-destructive px-5 py-4 font-bold text-destructive-foreground transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {withdrawMutation.isPending
                      ? t.withdrawingButton
                      : `${t.withdrawButton} ${Number(myContribution).toFixed(4)} ${
                          NETWORK.currency
                        }`}
                  </button>
                )}

                {status === "failed" && Number(myContribution) <= 0 && (
                  <div className="rounded-2xl border border-border bg-background/50 px-5 py-4 text-center font-bold text-muted-foreground">
                    {t.noFundsToWithdraw}
                  </div>
                )}

                <button
                  onClick={copyLink}
                  className={`w-full rounded-2xl border px-5 py-4 font-bold transition-all backdrop-blur-sm shadow-sm flex items-center justify-center gap-2 ${
                    copied ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 scale-[0.98]' : 'border-border bg-background/50 text-foreground hover:bg-accent'
                  }`}
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>{t.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <span>🔗</span>
                      <span>{t.shareProposal}</span>
                    </>
                  )}
                </button>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}