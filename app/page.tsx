"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocalWallet } from "../hooks/useLocalWallet";
import { useKastj } from "../hooks/useKastj";
import { useSupabaseProposals } from "../hooks/useSupabaseProposals";
import { StatsBar } from "../components/dashboard/StatsBar";
import { CreateProposalForm } from "../components/proposal/CreateProposalForm";
import { ProposalCard } from "../components/proposal/ProposalCard";

type Filter = "all" | "active" | "succeeded" | "failed";
type Sort = "newest" | "raised" | "ending";

function short(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function metadataText(metadataURI?: string) {
  if (!metadataURI?.startsWith("local://")) return "";

  try {
    const metadata = JSON.parse(
      decodeURIComponent(metadataURI.replace("local://", ""))
    );

    return `${metadata.title ?? ""} ${metadata.description ?? ""}`.toLowerCase();
  } catch {
    return "";
  }
}

export default function HomePage() {
  const wallet = useLocalWallet();
  const kastj = useKastj(wallet.signer);
  const db = useSupabaseProposals();

  const proposals = db.dbProposals ?? [];

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("10");
  const [duration, setDuration] = useState("3600");
  const [fundAmount, setFundAmount] = useState("1");

  const filteredProposals = proposals
    .filter((proposal) => {
      if (filter === "active" && proposal.status !== 0) return false;
      if (filter === "succeeded" && proposal.status !== 1) return false;
      if (filter === "failed" && proposal.status !== 2) return false;

      if (!search.trim()) return true;

      return metadataText(proposal.metadataURI).includes(
        search.toLowerCase().trim()
      );
    })
    .sort((a, b) => {
      if (sort === "raised") {
        return Number(b.totalRaised) - Number(a.totalRaised);
      }

      if (sort === "ending") {
        return Number(a.deadline) - Number(b.deadline);
      }

      return Number(b.id) - Number(a.id);
    });

  useEffect(() => {
    if (wallet.connected) {
      db.loadDbProposals();
    }
  }, [wallet.connected]);

  async function refreshDbSoon() {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await db.loadDbProposals();
  }

  async function handleCreate() {
    if (!title || !description) {
      toast.error("Añade título y descripción");
      return;
    }

    if (!recipient || !goal || !duration) {
      toast.error("Rellena todos los campos");
      return;
    }

    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      toast.error("La wallet destinataria no parece válida");
      return;
    }

    if (Number(goal) <= 0) {
      toast.error("El objetivo debe ser mayor que 0");
      return;
    }

    if (Number(duration) <= 0) {
      toast.error("La duración debe ser mayor que 0");
      return;
    }

    const metadataURI = `local://${encodeURIComponent(
      JSON.stringify({
        title,
        description,
        createdAt: Date.now(),
      })
    )}`;

    await kastj.createProposal(recipient, goal, Number(duration), metadataURI);
    await refreshDbSoon();

    setTitle("");
    setDescription("");
    setRecipient("");
    setGoal("10");
    setDuration("3600");
  }

  async function handleFund(id: number) {
    if (Number(fundAmount) <= 0) {
      toast.error("La cantidad debe ser mayor que 0");
      return;
    }

    await kastj.fundProposal(id, fundAmount);
    await refreshDbSoon();
  }

  async function handleFinalize(id: number) {
    await kastj.finalizeProposal(id);
    await refreshDbSoon();
  }

  async function handleWithdraw(id: number) {
    await kastj.withdraw(id);
    await refreshDbSoon();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#182131,_#09090b_45%)] p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-6 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-400">
              Kastj MVP · Supabase Indexer
            </div>

            <h1 className="text-5xl font-black tracking-tight">Kastj</h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Propuestas comunitarias con crowdfunding condicional, escrow y
              distribución automática de fondos.
            </p>
          </div>

          <button
            onClick={wallet.connect}
            className="rounded-2xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
          >
            {wallet.connected ? short(wallet.address) : "Conectar wallet"}
          </button>
        </header>

        {wallet.connected && <StatsBar proposals={proposals} />}

        <CreateProposalForm
          title={title}
          description={description}
          recipient={recipient}
          goal={goal}
          duration={duration}
          loading={kastj.loading}
          connected={wallet.connected}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onRecipientChange={setRecipient}
          onGoalChange={setGoal}
          onDurationChange={setDuration}
          onCreate={handleCreate}
        />

        <section className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Propuestas</h2>
              <p className="text-zinc-400">
                Explora campañas activas, exitosas y fallidas.
              </p>
            </div>

            <button
              onClick={db.loadDbProposals}
              disabled={!wallet.connected || db.loadingDb || kastj.loading}
              className="rounded-xl bg-zinc-800 px-5 py-3 font-bold transition hover:bg-zinc-700 disabled:opacity-40"
            >
              {db.loadingDb ? "Cargando..." : "Refrescar"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todas" },
              { key: "active", label: "Activas" },
              { key: "succeeded", label: "Exitosas" },
              { key: "failed", label: "Fallidas" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as Filter)}
                className={`rounded-xl px-4 py-2 font-semibold transition ${
                  filter === item.key
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-green-500"
              placeholder="Buscar por título o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-green-500"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              <option value="newest">Más nuevas</option>
              <option value="raised">Más recaudadas</option>
              <option value="ending">Terminan pronto</option>
            </select>
          </div>

          <input
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-blue-500"
            placeholder="Cantidad para apoyar en ETH fake"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
          />

          {!wallet.connected && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
              Conecta tu wallet para ver y crear propuestas.
            </div>
          )}

          {wallet.connected && filteredProposals.length === 0 && !db.loadingDb && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
              No hay propuestas para este filtro o búsqueda.
            </div>
          )}

          {wallet.connected && db.loadingDb && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
              Cargando propuestas...
            </div>
          )}

          <div className="grid gap-5">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                fundAmount={fundAmount}
                loading={kastj.loading}
                connected={wallet.connected}
                onFund={handleFund}
                onFinalize={handleFinalize}
                onWithdraw={handleWithdraw}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}