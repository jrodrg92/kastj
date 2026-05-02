"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { isAddress, parseEther, formatEther } from "ethers";
import { createProposalSchema, fundProposalSchema } from "../lib/validation";
import { calculateMinThreshold } from "../core/domain/ThresholdRules";

import { useLocalWallet } from "../hooks/useLocalWallet";
import { useProposalEngine } from "../hooks/useProposalEngine";
import { useUserDashboard } from "../hooks/useUserDashboard";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";

import { StatsBar } from "../components/dashboard/StatsBar";
import { CreateProposalForm } from "../components/proposal/CreateProposalForm";
import { ProposalCard } from "../components/proposal/ProposalCard";
import { UserDashboard } from "../components/dashboard/UserDashboard";
import { ActivityFeed } from "../components/activity/ActivityFeed";
import { AppHeader } from "../components/layout/AppHeader";

import { NETWORK } from "../lib/network";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";

import { useInfiniteProposals } from "../features/proposals/hooks/useInfiniteProposals";
import { useCreateProposal } from "../features/proposals/hooks/useCreateProposal";
import { useFundProposal } from "../features/proposals/hooks/useFundProposal";
import { useFinalizeProposal } from "../features/proposals/hooks/useFinalizeProposal";
import { useWithdrawProposal } from "../features/proposals/hooks/useWithdrawProposal";
import { useWithdrawMany } from "../features/proposals/hooks/useWithdrawMany";

type Filter =
  | "all"
  | "active"
  | "mine"
  | "supported"
  | "succeeded"
  | "failed";

type Sort = "newest" | "raised" | "ending";

function metadataText(metadataURI?: string | null) {
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
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);
  const feed = useActivityFeed();
  const { t } = useLanguage();
  const proposalsQuery = useInfiniteProposals();
  const proposals = useMemo(
    () => proposalsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [proposalsQuery.data],
  );
  const userDashboard = useUserDashboard(wallet.address);
  useRealtimeNotifications(wallet.address);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        proposalsQuery.hasNextPage &&
        !proposalsQuery.isFetchingNextPage
      ) {
        void proposalsQuery.fetchNextPage();
      }
    },
    [proposalsQuery],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Mutations via engine abstraction
  const createMutation = useCreateProposal(ctx);
  const fundMutation = useFundProposal(ctx);
  const finalizeMutation = useFinalizeProposal(ctx);
  const withdrawMutation = useWithdrawProposal(ctx);
  const withdrawManyMutation = useWithdrawMany(ctx);

  const isAnyMutationPending =
    createMutation.isPending ||
    fundMutation.isPending ||
    finalizeMutation.isPending ||
    withdrawMutation.isPending ||
    withdrawManyMutation.isPending;

  const [filter, setFilter] = useState<Filter>("all");
  const [supportedIds, setSupportedIds] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("10000");
  const [duration, setDuration] = useState("86400");
  const [fundAmount, setFundAmount] = useState("1");

  const autoThresholdStr = useMemo(() => {
    try {
      const g = parseEther(goal || "0");
      const d = Number(duration || "0");
      const wei = calculateMinThreshold(g, d);
      return formatEther(wei);
    } catch {
      return "0";
    }
  }, [goal, duration]);

  const [minThreshold, setMinThreshold] = useState("4000");

  // Keep minThreshold in sync if it falls below autoThreshold
  useEffect(() => {
    if (Number(minThreshold) < Number(autoThresholdStr)) {
      setMinThreshold(autoThresholdStr);
    }
  }, [autoThresholdStr, minThreshold]);

  const supportedIdsSet = useMemo(() => {
    return new Set(userDashboard.dashboard.supportedIds ?? supportedIds);
  }, [userDashboard.dashboard.supportedIds, supportedIds]);

  const filteredProposals = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return proposals
      .filter((proposal) => {
        if (filter === "active" && proposal.status !== 0) return false;

        if (filter === "mine") {
          return (
            proposal.creator.toLowerCase() === wallet.address?.toLowerCase()
          );
        }

        if (filter === "supported") {
          return supportedIdsSet.has(proposal.id);
        }

        if (filter === "succeeded" && proposal.status !== 1) return false;
        if (filter === "failed" && proposal.status !== 2) return false;

        if (!normalizedSearch) return true;

        return metadataText(proposal.metadataURI).includes(normalizedSearch);
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
  }, [filter, proposals, search, sort, supportedIdsSet, wallet.address]);

  async function loadMySupportedProposals() {
    if (!wallet.address) return;

    const { data, error } = await supabase
      .from("fundings")
      .select("proposal_id")
      .eq("supporter", wallet.address);

    if (error) {
      console.error(error);
      return;
    }

    const ids = Array.from(
      new Set((data ?? []).map((item) => Number(item.proposal_id)))
    );

    setSupportedIds(ids);
  }

  useEffect(() => {
    if (!wallet.connected) return;

    void (async () => {
      await proposalsQuery.refetch();
      await loadMySupportedProposals();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.connected, wallet.address]);

  async function handleCreate() {
    if (!wallet.connected) {
      toast.error(t.connectWalletFirst);
      return;
    }

    const result = createProposalSchema.safeParse({
      title,
      description,
      recipient,
      goal,
      minThreshold,
      duration,
    });

    if (!result.success) {
      const key = result.error.issues[0].message as keyof typeof t;
      toast.error(t[key] ?? result.error.issues[0].message);
      return;
    }

    const metadataURI = `local://${encodeURIComponent(
      JSON.stringify({
        title,
        description,
      })
    )}`;

    try {
      await createMutation.mutateAsync({
        recipient,
        asset: { type: "native" },
        goal,
        minThreshold,
        durationSeconds: Number(duration),
        metadataURI,
      });

      setTitle("");
      setDescription("");
      setRecipient("");
      setGoal("10000");
      setMinThreshold("100");
      setDuration("86400");

      await loadMySupportedProposals();
    } catch (e) {
      // Error is handled by the mutation's onError toast
      console.debug("Create mutation failed:", e);
    }
  }

  async function handleFund(id: number) {
    const proposal = proposals.find((p) => p.id === id);

    if (!proposal) {
      toast.error(t.proposalNotFound);
      return;
    }

    const validation = fundProposalSchema.safeParse({ amount: fundAmount });

    if (!validation.success) {
      const key = validation.error.issues[0].message as keyof typeof t;
      toast.error(t[key] ?? validation.error.issues[0].message);
      return;
    }

    try {
      await fundMutation.mutateAsync({
        proposalId: id,
        asset: proposal.asset,
        amount: fundAmount,
      });

      await loadMySupportedProposals();
    } catch (e) {
      console.debug("Fund mutation failed:", e);
    }
  }

  async function handleFinalize(id: number) {
    try {
      await finalizeMutation.mutateAsync(id);
      await loadMySupportedProposals();
    } catch (e) {
      console.debug("Finalize mutation failed:", e);
    }
  }

  async function handleWithdraw(id: number) {
    try {
      await withdrawMutation.mutateAsync(id);
      await loadMySupportedProposals();
    } catch (e) {
      console.debug("Withdraw mutation failed:", e);
    }
  }

  async function handleWithdrawAll(ids: number[]) {
    if (!ids.length) return;

    try {
      await withdrawManyMutation.mutateAsync(ids);
      await loadMySupportedProposals();
    } catch (e) {
      console.debug("Withdraw many mutation failed:", e);
    }
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
                <p className="mt-1 text-sm text-zinc-400">{t.step11}</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="font-bold">2. {t.step2}</p>
                <p className="mt-1 text-sm text-zinc-400">{t.step21}</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="font-bold">3. {t.step3}</p>
                <p className="mt-1 text-sm text-zinc-400">{t.step31}</p>
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
            minThreshold={minThreshold}
            autoThreshold={autoThresholdStr}
            duration={duration}
            loading={isAnyMutationPending}
            connected={wallet.connected}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onRecipientChange={setRecipient}
            onGoalChange={setGoal}
            onMinThresholdChange={setMinThreshold}
            onDurationChange={setDuration}
            onCreate={handleCreate}
          />
        </div>

        <section id="proposals" className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">{t.proposals}</h2>
              <p className="text-zinc-400">{t.findnew}</p>
            </div>

            <button
              onClick={() => proposalsQuery.refetch()}
              disabled={proposalsQuery.isFetching}
              className="rounded-xl bg-zinc-800 px-5 py-3 font-bold transition hover:bg-zinc-700 disabled:opacity-40"
            >
              {proposalsQuery.isFetching ? t.loading : t.refresh}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: t.all },
              { key: "active", label: t.active },
              { key: "mine", label: t.mine },
              { key: "supported", label: t.sup },
              { key: "succeeded", label: t.succeeded },
              { key: "failed", label: t.failed },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as Filter)}
                className={`rounded-xl px-4 py-2 font-semibold transition ${filter === item.key
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
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-green-500"
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
            >
              <option value="newest">{t.newest}</option>
              <option value="raised">{t.moreRe}</option>
              <option value="ending">{t.endSoon}</option>
            </select>
          </div>

          <input
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-blue-500"
            placeholder={`${t.fundingFor} ${NETWORK.currency}`}
            value={fundAmount}
            onChange={(event) => setFundAmount(event.target.value)}
          />

          {!wallet.connected && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
              {t.conectWallet}
            </div>
          )}

          {wallet.connected &&
            filteredProposals.length === 0 &&
            !proposalsQuery.isLoading && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
                {t.noProposalsFilter}
              </div>
            )}

          {wallet.connected && proposalsQuery.isLoading && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
              {t.loadingProposals}
            </div>
          )}

          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              fundAmount={fundAmount}
              loading={isAnyMutationPending}
              connected={wallet.connected}
              isSupported={supportedIdsSet.has(proposal.id)}
              onFund={handleFund}
              onFinalize={handleFinalize}
              onWithdraw={handleWithdraw}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {proposalsQuery.isFetchingNextPage && (
              <p className="text-zinc-400">{t.loading}</p>
            )}
            {proposalsQuery.hasNextPage &&
              !proposalsQuery.isFetchingNextPage && (
                <button
                  onClick={() => void proposalsQuery.fetchNextPage()}
                  className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-zinc-300 transition hover:bg-zinc-700"
                >
                  {t.loading}
                </button>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}