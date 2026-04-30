"use client";

import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useLocalWallet } from "../../../hooks/useLocalWallet";
import { useKastj } from "../../../hooks/useKastj";
import { NETWORK } from "../../../lib/network";

function short(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

function statusLabel(status: string) {
  if (status === "active") return "🟡 Activa";
  if (status === "succeeded") return "🟢 Exitosa";
  if (status === "failed") return "🔴 Fallida";
  return "❓ Desconocida";
}

function formatTime(seconds: number) {
  if (seconds <= 0) return "Expirada";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();

  const wallet = useLocalWallet();
  const kastj = useKastj(wallet.signer);

  const proposalId = Number(params.id);

  const [proposal, setProposal] = useState<any>(null);
  const [fundings, setFundings] = useState<any[]>([]);
  const [myContribution, setMyContribution] = useState("0");
  const [fundAmount, setFundAmount] = useState("1");
  const [loading, setLoading] = useState(false);

  async function loadDetail() {
    setLoading(true);

    const { data: proposalData, error: proposalError } = await supabase
      .from("proposals")
      .select(`
        *,
        proposal_metadata (
          title,
          description,
          created_at
        )
      `)
      .eq("id", proposalId)
      .single();

    const { data: fundingData, error: fundingError } = await supabase
      .from("fundings")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("id", { ascending: false });

    setLoading(false);

    if (proposalError) {
      console.error(proposalError);
      toast.error("No se pudo cargar la propuesta");
      return;
    }

    if (fundingError) {
      console.error(fundingError);
      toast.error("No se pudo cargar el historial");
      return;
    }

    setProposal(proposalData);
    setFundings(fundingData ?? []);

    if (wallet.address && fundingData) {
      const mine = fundingData
        .filter(
          (f) => f.supporter?.toLowerCase() === wallet.address.toLowerCase()
        )
        .reduce((acc, f) => acc + BigInt(f.amount), 0n);

      setMyContribution(formatEther(mine));
    } else {
      setMyContribution("0");
    }
  }

  useEffect(() => {
    if (!proposalId) return;

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

    return () => {
      supabase.removeChannel(proposalsChannel);
      supabase.removeChannel(fundingsChannel);
    };
  }, [proposalId, wallet.address]);

  async function refreshSoon() {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await loadDetail();
  }

  async function handleFund() {
    if (!wallet.connected) {
      toast.error("Conecta tu wallet");
      return;
    }

    if (Number(fundAmount) <= 0) {
      toast.error("Cantidad inválida");
      return;
    }

    await kastj.fundProposal(proposalId, fundAmount);
    await refreshSoon();
  }

  async function handleFinalize() {
    if (!wallet.connected) {
      toast.error("Conecta tu wallet");
      return;
    }

    await kastj.finalizeProposal(proposalId);
    await refreshSoon();
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

    await kastj.withdraw(proposalId);
    await refreshSoon();
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

  const metadata =
    proposal.proposal_metadata ?? parseMetadata(proposal.metadata_uri);

  const goal = Number(formatEther(BigInt(proposal.goal)));
  const raised = Number(formatEther(BigInt(proposal.total_raised)));
  const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= Number(proposal.deadline);
  const isActive = proposal.status === "active";
  const canFund = wallet.connected && isActive && !isExpired;
  const canFinalize = wallet.connected && isActive && isExpired;

  const canWithdraw =
    wallet.connected &&
    proposal.status === "failed" &&
    Number(myContribution) > 0;

  const supportersCount = new Set(
    fundings.map((f) => f.supporter?.toLowerCase())
    ).size;

  const isCreator =
    wallet.address &&
    proposal.creator?.toLowerCase() === wallet.address.toLowerCase();

  const isTrending = percent >= 80;

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado 📋");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#182131,_#09090b_45%)] p-6 text-white md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-zinc-800 px-4 py-2 font-semibold hover:bg-zinc-700"
        >
          ← Volver
        </button>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-zinc-500">Propuesta #{proposal.id}</p>
              <h1 className="mt-2 text-4xl font-black">{metadata.title}</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                {metadata.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-bold">
                    {statusLabel(proposal.status)}
                </span>

                {isCreator && (
                    <span className="rounded-full bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-400">
                    Eres el creador
                    </span>
                )}

                {isTrending && (
                    <span className="rounded-full bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
                    🔥 Trending
                    </span>
                )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-400 md:grid-cols-2">
            <p>
              Creador:{" "}
              <span className="text-white">{short(proposal.creator)}</span>
            </p>
            <p>
              Destinatario:{" "}
              <span className="text-white">{short(proposal.recipient)}</span>
            </p>
            <p>
              Deadline:{" "}
              <span className="text-white">
                {isExpired
                  ? "Expirada"
                  : formatTime(Number(proposal.deadline) - now)}
              </span>
            </p>
            <p>
              Payout:{" "}
              <span className="text-white">
                93% destinatario · 5% creador · 2% treasury
              </span>
            </p>
            <p>
                Supporters:{" "}
                <span className="text-white">{supportersCount}</span>
                </p>

                <p>
                Compartir:{" "}
                <button
                    onClick={copyLink}
                    className="font-semibold text-green-400 hover:text-green-300"
                >
                    Copiar link
                </button>
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-3 flex justify-between text-lg font-bold">
              <span>
                {raised.toFixed(4)} / {goal.toFixed(4)} {NETWORK.currency}
              </span>
              <span>{percent.toFixed(1)}%</span>
            </div>

            <div className="h-6 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-6 rounded-full bg-green-500 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">Tu aportación</p>

            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-3xl font-black">
                  {Number(myContribution).toFixed(4)} {NETWORK.currency}
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  {Number(myContribution) > 0
                    ? "Has apoyado esta propuesta."
                    : "Todavía no has aportado a esta propuesta."}
                </p>
              </div>

              {proposal.status === "failed" && Number(myContribution) > 0 && (
                <span className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400">
                  Puedes retirar tus fondos
                </span>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Supporters únicos</p>
                <p className="mt-2 text-3xl font-black">{supportersCount}</p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Progreso</p>
                <p className="mt-2 text-3xl font-black">{percent.toFixed(1)}%</p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Estado social</p>
                <p className="mt-2 text-2xl font-black">
                {isTrending ? "🔥 Trending" : "En progreso"}
                </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none focus:border-blue-500 md:w-56"
              placeholder={`Cantidad ${NETWORK.currency}`}
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />

            <button
              disabled={!canFund || kastj.loading}
              onClick={handleFund}
              className="rounded-2xl bg-blue-500 px-5 py-3 font-bold text-black hover:bg-blue-400 disabled:opacity-40"
            >
              {kastj.loading ? "Procesando..." : "Apoyar"}
            </button>

            <button
              disabled={!canFinalize || kastj.loading}
              onClick={handleFinalize}
              className="rounded-2xl bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-40"
            >
              Finalizar
            </button>

            {proposal.status === "failed" && (
              <button
                disabled={!canWithdraw || kastj.loading}
                onClick={handleWithdraw}
                className="rounded-2xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-400 disabled:opacity-40"
              >
                {Number(myContribution) > 0
                  ? `Retirar ${Number(myContribution).toFixed(4)} ${NETWORK.currency}`
                  : "Sin fondos para retirar"}
              </button>
            )}

            {!wallet.connected && (
              <button
                onClick={wallet.connect}
                className="rounded-2xl bg-white px-5 py-3 font-bold text-black hover:bg-zinc-200"
              >
                Conectar wallet
              </button>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
          <h2 className="text-2xl font-bold">Historial de funding</h2>

          {fundings.length === 0 && (
            <p className="mt-4 text-zinc-400">Todavía no hay aportaciones.</p>
          )}

          <div className="mt-5 space-y-3">
            {fundings.map((funding) => (
              <div
                key={funding.id}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:flex-row md:items-center"
              >
                <div>
                  <p className="font-semibold">{short(funding.supporter)}</p>
                  <p className="text-sm text-zinc-400">
                    {new Date(Number(funding.created_at)).toLocaleString()}
                  </p>
                </div>

                <p className="text-lg font-bold text-green-400">
                  +{formatEther(BigInt(funding.amount))} {NETWORK.currency}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}