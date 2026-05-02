"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther } from "ethers";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "../../../lib/supabase";
import { useWalletContext } from "../../../contexts/WalletContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useProposalEngine } from "../../../hooks/useProposalEngine";
import { NETWORK } from "../../../lib/network";
import {
  formatRemainingTime,
  isExpired as hasExpired,
} from "../../../lib/time";
import { AppHeader } from "../../../components/layout/AppHeader";

import type { DbProposal, DbFunding, DbActivity } from "../../../types/supabase";
import { useFundProposal } from "../../../features/proposals/hooks/useFundProposal";
import { useFinalizeProposal } from "../../../features/proposals/hooks/useFinalizeProposal";
import { useWithdrawProposal } from "../../../features/proposals/hooks/useWithdrawProposal";

type ProposalStatus = "active" | "succeeded" | "failed" | "unknown";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function normalizeStatus(status: string | number): ProposalStatus {
  if (status === 0 || status === "active") return "active";
  if (status === 1 || status === "succeeded") return "succeeded";
  if (status === 2 || status === "failed") return "failed";
  return "unknown";
}

function parseMetadata(uri?: string) {
  if (!uri?.startsWith("local://") && !uri?.startsWith("supabase://")) {
    return {
      title: "Propuesta sin título",
      description: "Sin descripción disponible.",
    };
  }

  try {
    const raw = uri.replace("local://", "").replace("supabase://", "");
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return {
      title: "Metadata inválida",
      description: "No se pudo leer la metadata.",
    };
  }
}

function statusLabel(status: ProposalStatus) {
  if (status === "active") return "🟡 Activa";
  if (status === "succeeded") return "🟢 Exitosa";
  if (status === "failed") return "🔴 Fallida";
  return "❓ Desconocida";
}

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

  const wallet = useWalletContext();
  const { t } = useLanguage();
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);

  // Feature hooks for mutations
  const fundMutation = useFundProposal(ctx);
  const finalizeMutation = useFinalizeProposal(ctx);
  const withdrawMutation = useWithdrawProposal(ctx);

  const isMutating =
    fundMutation.isPending ||
    finalizeMutation.isPending ||
    withdrawMutation.isPending;

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const proposalId = Number(idParam);

  const [proposal, setProposal] = useState<DbProposal | null>(null);
  const [fundings, setFundings] = useState<DbFunding[]>([]);
  const [activity, setActivity] = useState<DbActivity[]>([]);
  const [myContribution, setMyContribution] = useState("0");
  const [fundAmount, setFundAmount] = useState("1");
  const [loading, setLoading] = useState(false);

  async function loadDetail() {
    if (!Number.isFinite(proposalId)) return;

    setLoading(true);

    const { data: proposalData, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle();

    const { data: fundingData, error: fundingError } = await supabase
      .from("fundings")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("id", { ascending: false });

    const { data: activityData, error: activityError } = await supabase
      .from("activity")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("id", { ascending: false });

    setLoading(false);

    if (proposalError || !proposalData) {
      console.error("proposalError", proposalError);
      setProposal(null);
      return;
    }

    if (fundingError) {
      console.error("fundingError", fundingError);
      toast.error("No se pudo cargar el historial");
      return;
    }

    if (activityError) {
      console.error("activityError", activityError);
      toast.error("No se pudo cargar la actividad");
      return;
    }

    setProposal(proposalData);
    setFundings(fundingData ?? []);
    setActivity(activityData ?? []);

    if (wallet.address && fundingData) {
      const mine = fundingData
        .filter(
          (funding) =>
            funding.supporter?.toLowerCase() === wallet.address?.toLowerCase()
        )
        .reduce((acc, funding) => acc + BigInt(funding.amount), 0n);

      setMyContribution(formatEther(mine));
    } else {
      setMyContribution("0");
    }
  }

  useEffect(() => {
    if (!Number.isFinite(proposalId)) return;

    loadDetail();

    const proposalsChannel = supabase
      .channel(`proposal-${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
          filter: `id=eq.${proposalId}`,
        },
        () => loadDetail()
      )
      .subscribe();

    const fundingsChannel = supabase
      .channel(`fundings-${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fundings",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => loadDetail()
      )
      .subscribe();

    const activityChannel = supabase
      .channel(`activity-${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => loadDetail()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(proposalsChannel);
      supabase.removeChannel(fundingsChannel);
      supabase.removeChannel(activityChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, wallet.address]);

  async function handleFund() {
    if (!wallet.connected) {
      toast.error("Conecta tu wallet");
      return;
    }

    if (!proposal) {
      toast.error("Propuesta no cargada");
      return;
    }

    if (Number(fundAmount) <= 0) {
      toast.error("Cantidad inválida");
      return;
    }

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    const asset =
      !proposal.token || proposal.token === ZERO_ADDRESS
        ? ({ type: "native" } as const)
        : ({
            type: "krc20" as const,
            tokenAddress: proposal.token as `0x${string}`,
          });

    await fundMutation.mutateAsync({
      proposalId,
      asset,
      amount: fundAmount,
    });

    await loadDetail();
  }

  async function handleFinalize() {
    if (!wallet.connected) {
      toast.error("Conecta tu wallet");
      return;
    }

    await finalizeMutation.mutateAsync(proposalId);
    await loadDetail();
  }

  async function handleWithdraw() {
    if (!wallet.connected) {
      toast.error("Conecta tu wallet");
      return;
    }

    if (Number(myContribution) <= 0) {
      toast.error("No tienes fondos para retirar");
      return;
    }

    await withdrawMutation.mutateAsync(proposalId);
    await loadDetail();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado 📋");
  }

  const metadata = useMemo(() => {
    return parseMetadata(proposal?.metadata_uri ?? undefined);
  }, [proposal]);

  if (!Number.isFinite(proposalId)) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground">
        ID de propuesta inválido.
      </main>
    );
  }

  if (loading && !proposal) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground flex items-center justify-center">
        {t.loadingProposal}
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground flex items-center justify-center">
        Propuesta no encontrada.
      </main>
    );
  }

  const status = normalizeStatus(proposal.status);

  const goal = Number(formatEther(BigInt(proposal.goal ?? 0)));
  const raised = Number(formatEther(BigInt(proposal.total_raised ?? 0)));
  const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const isExpired = hasExpired(Number(proposal.deadline));
  const isActive = status === "active";
  const canFund = wallet.connected && isActive && !isExpired;
  const canFinalize =
    wallet.connected && isActive && isExpired && !proposal.success;
  const canWithdraw =
    wallet.connected && status === "failed" && Number(myContribution) > 0;

  const supportersCount = new Set(
    fundings.map((funding) => funding.supporter?.toLowerCase())
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

        <div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card/50 px-5 text-sm font-semibold text-foreground transition-all hover:bg-accent hover:text-accent-foreground backdrop-blur-md shadow-sm"
          >
            ← {t.backToProposals}
          </button>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <section className="premium-glass rounded-3xl p-8 lg:p-10">
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-4 py-1.5 text-sm font-bold text-foreground shadow-sm">
                  <div className={`h-2 w-2 rounded-full ${status === "active" ? "bg-yellow-500" : status === "succeeded" ? "bg-green-500" : "bg-red-500"} shadow-[0_0_8px_currentColor]`} />
                  {statusLabel(status)}
                </span>

                {isCreator && (
                  <span className="flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-500 shadow-sm">
                    {t.youAreCreator}
                  </span>
                )}

                {isTrending && (
                  <span className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-sm font-bold text-orange-500 shadow-sm">
                    🔥 Trending
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Proposal #{proposal.id}</p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-gradient md:text-5xl leading-tight pb-2">
                {metadata.title}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {metadata.description}
              </p>

              <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-background/50 p-5 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  Creator:{" "}
                  <span className="font-mono text-foreground/80">{short(proposal.creator)}</span>
                </p>

                <p>
                  Recipient:{" "}
                  <span className="font-mono text-foreground/80">
                    {short(proposal.recipient)}
                  </span>
                </p>

                <p>
                  Deadline:{" "}
                  <span className="font-medium text-foreground/80">
                    {isExpired
                      ? "Expired"
                      : formatRemainingTime(Number(proposal.deadline))}
                  </span>
                </p>

                <p>
                  Supporters:{" "}
                  <span className="font-medium text-foreground/80">{supportersCount}</span>
                </p>
              </div>
            </section>

            <section className="premium-glass rounded-3xl p-8 lg:p-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Why trust this proposal?</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="group rounded-2xl border border-border bg-background/50 p-6 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <p className="font-semibold text-foreground">Escrow protected</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Funds stay locked until settlement.
                  </p>
                </div>

                <div className="group rounded-2xl border border-border bg-background/50 p-6 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <p className="font-semibold text-foreground">Automatic settlement</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Success distributes funds. Failure enables withdrawals.
                  </p>
                </div>

                <div className="group rounded-2xl border border-border bg-background/50 p-6 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <p className="font-semibold text-foreground">Transparent history</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Funding and status changes are indexed and visible.
                  </p>
                </div>
              </div>
            </section>

            <section className="premium-glass rounded-3xl p-8 lg:p-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Proposal activity</h2>

              {activity.length === 0 && (
                <p className="mt-4 text-muted-foreground">No activity yet.</p>
              )}

              <div className="mt-5 max-h-[400px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background/50 p-4 transition-all hover:bg-card/80"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-lg text-secondary-foreground">
                      {activityIcon(item.type)}
                    </span>

                    <div>
                      <p className="font-medium text-foreground">{item.message}</p>
                      <p className="text-sm text-muted-foreground/80">
                        {item.actor ? short(item.actor) : "System"} ·{" "}
                        {new Date(item.created_at ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <section className="premium-glass rounded-3xl p-8 lg:p-10">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Raised</p>

              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tracking-tight text-foreground">{raised.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    of {goal.toFixed(4)} {NETWORK.currency}
                  </p>
                </div>

                <p className="text-3xl font-bold tracking-tight text-emerald-500">
                  {percent.toFixed(1)}%
                </p>
              </div>

              <div className="mt-8 h-2 overflow-hidden rounded-full bg-secondary ring-1 ring-inset ring-black/10 dark:ring-white/5">
                <div
                  className="h-full rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all duration-1000 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-background/50 p-5 shadow-inner">
                  <p className="text-sm font-medium text-muted-foreground">Supporters</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {supportersCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5 shadow-inner">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="mt-2 text-lg font-bold capitalize text-foreground">{status}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-background/50 p-6 shadow-inner">
                <p className="text-sm font-medium text-muted-foreground">Your contribution</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {Number(myContribution).toFixed(4)} <span className="text-xl text-muted-foreground">{NETWORK.currency}</span>
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {isActive && !isExpired && (
                  <>
                    <input
                      className="w-full rounded-2xl border border-border bg-background/80 p-5 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
                      placeholder={`Amount ${NETWORK.currency}`}
                      value={fundAmount}
                      onChange={(event) => setFundAmount(event.target.value)}
                    />

                    <button
                      disabled={!canFund || isMutating}
                      onClick={handleFund}
                      className="premium-btn w-full rounded-2xl px-5 py-4 font-bold text-lg disabled:opacity-50"
                    >
                      {fundMutation.isPending
                        ? "Processing..."
                        : `Support ${fundAmount} ${NETWORK.currency}`}
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
                      ? "Finalizing..."
                      : "Finalize proposal"}
                  </button>
                )}

                {status === "succeeded" && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    Funds distributed successfully
                  </div>
                )}

                {status === "failed" && Number(myContribution) > 0 && (
                  <button
                    disabled={!canWithdraw || isMutating}
                    onClick={handleWithdraw}
                    className="w-full rounded-2xl bg-destructive px-5 py-4 font-bold text-destructive-foreground transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {withdrawMutation.isPending
                      ? "Withdrawing..."
                      : `Withdraw ${Number(myContribution).toFixed(4)} ${
                          NETWORK.currency
                        }`}
                  </button>
                )}

                {status === "failed" && Number(myContribution) <= 0 && (
                  <div className="rounded-2xl border border-border bg-background/50 px-5 py-4 text-center font-bold text-muted-foreground">
                    No funds to withdraw
                  </div>
                )}

                <button
                  onClick={copyLink}
                  className="w-full rounded-2xl border border-border bg-background/50 px-5 py-4 font-bold text-foreground transition-all hover:bg-accent backdrop-blur-sm hover:shadow-sm"
                >
                  Copy share link
                </button>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}