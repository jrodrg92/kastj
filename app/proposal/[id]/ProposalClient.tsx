"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther } from "ethers";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "../../../lib/supabase";
import { useLocalWallet } from "../../../hooks/useLocalWallet";
import { useProposalEngine } from "../../../hooks/useProposalEngine";
import { NETWORK } from "../../../lib/network";
import {
  formatRemainingTime,
  isExpired as hasExpired,
} from "../../../lib/time";
import { AppHeader } from "../../../components/layout/AppHeader";

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

  const wallet = useLocalWallet();
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [proposal, setProposal] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fundings, setFundings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activity, setActivity] = useState<any[]>([]);
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
    return parseMetadata(proposal?.metadata_uri);
  }, [proposal]);

  if (!Number.isFinite(proposalId)) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        ID de propuesta inválido.
      </main>
    );
  }

  if (loading && !proposal) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Cargando propuesta...
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
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
    wallet.connected && isActive && isExpired && !proposal.finalized;
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#182131,_#09090b_45%)] p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <AppHeader
          connected={wallet.connected}
          address={wallet.address}
          connect={wallet.connect}
          signer={wallet.signer}
        />

        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-zinc-800 px-4 py-2 font-semibold hover:bg-zinc-700"
        >
          ← Back to proposals
        </button>

        <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8 shadow-2xl">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-bold">
                  {statusLabel(status)}
                </span>

                {isCreator && (
                  <span className="rounded-full bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-400">
                    You are the creator
                  </span>
                )}

                {isTrending && (
                  <span className="rounded-full bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
                    🔥 Trending
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-500">Proposal #{proposal.id}</p>

              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-tight">
                {metadata.title}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
                {metadata.description}
              </p>

              <div className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-400 md:grid-cols-2">
                <p>
                  Creator:{" "}
                  <span className="text-white">{short(proposal.creator)}</span>
                </p>

                <p>
                  Recipient:{" "}
                  <span className="text-white">
                    {short(proposal.recipient)}
                  </span>
                </p>

                <p>
                  Deadline:{" "}
                  <span className="text-white">
                    {isExpired
                      ? "Expired"
                      : formatRemainingTime(Number(proposal.deadline))}
                  </span>
                </p>

                <p>
                  Supporters:{" "}
                  <span className="text-white">{supportersCount}</span>
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
              <h2 className="text-2xl font-bold">Why trust this proposal?</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="font-bold">Escrow protected</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Funds stay locked until settlement.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="font-bold">Automatic settlement</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Success distributes funds. Failure enables withdrawals.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="font-bold">Transparent history</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Funding and status changes are indexed and visible.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
              <h2 className="text-2xl font-bold">Proposal activity</h2>

              {activity.length === 0 && (
                <p className="mt-4 text-zinc-400">No activity yet.</p>
              )}

              <div className="mt-5 max-h-[400px] space-y-3 overflow-y-auto pr-2">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <span className="text-xl">{activityIcon(item.type)}</span>

                    <div>
                      <p className="font-semibold">{item.message}</p>
                      <p className="text-sm text-zinc-400">
                        {item.actor ? short(item.actor) : "System"} ·{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl">
              <p className="text-sm text-zinc-400">Raised</p>

              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black">{raised.toFixed(4)}</p>
                  <p className="text-sm text-zinc-400">
                    of {goal.toFixed(4)} {NETWORK.currency}
                  </p>
                </div>

                <p className="text-2xl font-black text-green-400">
                  {percent.toFixed(1)}%
                </p>
              </div>

              <div className="mt-5 h-6 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-6 rounded-full bg-green-500 transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400">Supporters</p>
                  <p className="mt-1 text-2xl font-black">
                    {supportersCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400">Status</p>
                  <p className="mt-1 text-lg font-black">{status}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-sm text-zinc-400">Your contribution</p>
                <p className="mt-1 text-3xl font-black">
                  {Number(myContribution).toFixed(4)} {NETWORK.currency}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {isActive && !isExpired && (
                  <>
                    <input
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none focus:border-blue-500"
                      placeholder={`Amount ${NETWORK.currency}`}
                      value={fundAmount}
                      onChange={(event) => setFundAmount(event.target.value)}
                    />

                    <button
                      disabled={!canFund || isMutating}
                      onClick={handleFund}
                      className="w-full rounded-2xl bg-blue-500 px-5 py-4 font-bold text-black hover:bg-blue-400 disabled:opacity-40"
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
                    className="w-full rounded-2xl bg-yellow-500 px-5 py-4 font-bold text-black hover:bg-yellow-400 disabled:opacity-40"
                  >
                    {finalizeMutation.isPending
                      ? "Finalizing..."
                      : "Finalize proposal"}
                  </button>
                )}

                {status === "succeeded" && (
                  <div className="rounded-2xl bg-green-500/10 px-5 py-4 text-center font-bold text-green-400">
                    Funds distributed successfully
                  </div>
                )}

                {status === "failed" && Number(myContribution) > 0 && (
                  <button
                    disabled={!canWithdraw || isMutating}
                    onClick={handleWithdraw}
                    className="w-full rounded-2xl bg-red-500 px-5 py-4 font-bold text-white hover:bg-red-400 disabled:opacity-40"
                  >
                    {withdrawMutation.isPending
                      ? "Withdrawing..."
                      : `Withdraw ${Number(myContribution).toFixed(4)} ${
                          NETWORK.currency
                        }`}
                  </button>
                )}

                {status === "failed" && Number(myContribution) <= 0 && (
                  <div className="rounded-2xl bg-zinc-800 px-5 py-4 text-center font-bold text-zinc-400">
                    No funds to withdraw
                  </div>
                )}

                <button
                  onClick={copyLink}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 font-bold text-white hover:bg-zinc-800"
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