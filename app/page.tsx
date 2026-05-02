"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocalWallet } from "../hooks/useLocalWallet";
import { useKastj } from "../hooks/useKastj";
import { useSupabaseProposals } from "../hooks/useSupabaseProposals";
import { useUserDashboard } from "../hooks/useUserDashboard";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { StatsBar } from "../components/dashboard/StatsBar";
import { CreateProposalForm } from "../components/proposal/CreateProposalForm";
import { ProposalCard } from "../components/proposal/ProposalCard";
import { UserDashboard } from "../components/dashboard/UserDashboard";
import { ActivityFeed } from "../components/activity/ActivityFeed";
import { NETWORK } from "../lib/network";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
import { AppHeader } from "../components/layout/AppHeader";
import { isAddress } from "ethers";
import type { Address } from "../core/domain/ProposalTypes";

type Filter =
  | "all"
  | "active"
  | "mine"
  | "supported"
  | "succeeded"
  | "failed";

type Sort = "newest" | "raised" | "ending";

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
  const feed = useActivityFeed();

  const proposals = db.dbProposals ?? [];

  const [filter, setFilter] = useState<Filter>("all");
  const [supportedIds, setSupportedIds] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("10000");
  const [fundAmount, setFundAmount] = useState("1");

  const { t } = useLanguage();
  const userDashboard = useUserDashboard(wallet.address);

  const [minThreshold, setMinThreshold] = useState("100");
  const [durationSeconds, setDurationSeconds] = useState(86400);

  // ✅ HANDLERS FIX
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch((e.target as HTMLInputElement).value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort((e.target as HTMLSelectElement).value as Sort);
  };

  const handleFundAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFundAmount((e.target as HTMLInputElement).value);
  };

  const supportedIdsSet = useMemo(() => {
    return new Set(userDashboard.dashboard.supportedIds ?? supportedIds);
  }, [userDashboard.dashboard.supportedIds, supportedIds]);

  const filteredProposals = proposals
    .filter((proposal) => {
      if (filter === "active" && proposal.status !== 0) return false;

      if (filter === "mine") {
        return (
          proposal.creator.toLowerCase() ===
          wallet.address?.toLowerCase()
        );
      }

      if (filter === "supported") {
        return supportedIdsSet.has(proposal.id);
      }

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

  async function loadMySupportedProposals() {
    if (!wallet.address) return;

    const { data } = await supabase
      .from("fundings")
      .select("proposal_id")
      .eq("supporter", wallet.address);

    const ids = Array.from(
      new Set((data ?? []).map((item) => Number(item.proposal_id)))
    );

    setSupportedIds(ids);
  }

  useEffect(() => {
    if (wallet.connected) {
      db.loadDbProposals();
      loadMySupportedProposals();
    }
  }, [wallet.connected, wallet.address]);

  async function refreshDbSoon() {
    await new Promise((r) => setTimeout(r, 800));
    await db.loadDbProposals();
  }

  async function handleCreate() {
    if (!title || !description) {
      toast.error("Añade título y descripción");
      return;
    }

    if (!isAddress(recipient)) {
      toast.error("Dirección inválida");
      return;
    }

    await kastj.createProposal({
      recipient: recipient as Address,
      asset: { type: "native" },
      goal,
      minThreshold,
      durationSeconds,
      metadataURI: `local://${encodeURIComponent(
        JSON.stringify({ title, description })
      )}`,
    });

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

  async function handleFund(id: number) {
    const proposal = proposals.find((p) => p.id === id);

    if (!proposal) {
      toast.error("Propuesta no encontrada");
      return;
    }

    await kastj.fundProposal({
      proposalId: id,
      asset: proposal.asset,
      amount: fundAmount,
    });

    await refreshDbSoon();
  }

  async function handleWithdrawAll(ids: number[]) {
    if (!ids.length) return;

    await kastj.withdrawMany(ids);
    await refreshDbSoon();
  }

  return (
  <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#13231f,_#09090b_45%)] px-4 py-8 text-white md:px-8">
    <div className="mx-auto max-w-7xl space-y-8">
        <AppHeader
          connected={wallet.connected}
          address={wallet.address}
          connect={wallet.connect}
          signer={wallet.signer}
        />

         <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 shadow-2xl">
            <div className="mb-4 inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-400">
              {t.autScrow}
            </div>

            <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
              {t.mission}
            </h2>

            <p className="mt-4 max-w-2xl text-lg text-zinc-400">
              {t.mission1}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#create"
                className="rounded-2xl bg-green-500 px-5 py-3 font-bold text-black transition hover:bg-green-400"
              >
                {t.createProposal}
              </a>

              <a
                href="#proposals"
                className="rounded-2xl bg-zinc-800 px-5 py-3 font-bold text-white transition hover:bg-zinc-700"
              >
                {t.exploreProposals}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
            <h3 className="text-2xl font-bold">{t.howItWorks}</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="font-bold">1. {t.step1}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {t.step11}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="font-bold">2. {t.step2}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {t.step21}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="font-bold">3. {t.step3}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {t.step31}
                </p>
              </div>
            </div>
          </div>
        </section>

        <StatsBar proposals={proposals} />

        {wallet.connected && (
          <UserDashboard
            dashboard={userDashboard.dashboard}
            loading={userDashboard.loadingUserDashboard}
            onWithdrawAll={handleWithdrawAll}
          />
        )}

                {wallet.connected && (
            <ActivityFeed
              activity={feed.activity}
              loading={feed.loadingActivity}
            />
          )}

        <div id="create">
          <CreateProposalForm
            title={title}
            description={description}
            recipient={recipient}
            goal={goal}
            loading={kastj.loading}
            connected={wallet.connected}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onRecipientChange={setRecipient}
            onGoalChange={setGoal}
            onCreate={handleCreate}
          />
        </div>

          <section id="proposals" className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold">{t.proposals}</h2>
                <p className="text-zinc-400">
                  {t.findnew}
                </p>
              </div>

              <button
                onClick={db.loadDbProposals}
                disabled={!wallet.connected || db.loadingDb || kastj.loading}
                className="rounded-xl bg-zinc-800 px-5 py-3 font-bold transition hover:bg-zinc-700 disabled:opacity-40"
              >
                {db.loadingDb ? "Cargando..." : t.refresh}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: t.all },
                { key: "active", label: t.active },
                { key: "mine", label: t.mine},
                { key: "supported", label: t.sup },
                { key: "succeeded", label: t.succeeded },
                { key: "failed", label: t.failed },
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
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-green-500"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
              >
                <option value="newest">{t.newest}</option>
                <option value="raised">{t.moreRe}</option>
                <option value="ending">{t.endSoon}</option>
              </select>
            </div>

            <input
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-blue-500"
              placeholder={`Cantidad para apoyar en ${NETWORK.currency}`}
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />

            {!wallet.connected && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
                {t.conectWallet}
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

          {filteredProposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              fundAmount={fundAmount}
              loading={kastj.loading}
              connected={wallet.connected}
              isSupported={supportedIdsSet.has(p.id)}
              onFund={handleFund}
              onFinalize={handleFinalize}
              onWithdraw={handleWithdraw}
            />
          ))}
          </section>
        </div>
      </main>
  );
}