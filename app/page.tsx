"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { isAddress, parseEther, formatEther } from "ethers";
import { createProposalSchema, fundProposalSchema } from "../lib/validation";
import { calculateMinThreshold } from "../core/domain/ThresholdRules";

import { useWalletContext } from "../contexts/WalletContext";
import { useProposalEngine } from "../hooks/useProposalEngine";

import { useActivityFeed } from "../hooks/useActivityFeed";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";

import { StatsBar } from "../components/dashboard/StatsBar";
import { CreateProposalForm } from "../components/proposal/CreateProposalForm";
import { ProposalCard } from "../components/proposal/ProposalCard";
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

export default function Home() {
  const wallet = useWalletContext();
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);
  const { t } = useLanguage();
  const proposalsQuery = useInfiniteProposals();
  const proposals = useMemo(
    () => proposalsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [proposalsQuery.data],
  );
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
  const isAnyMutationPending =
    createMutation.isPending ||
    fundMutation.isPending ||
    finalizeMutation.isPending ||
    withdrawMutation.isPending;

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
    return new Set(supportedIds);
  }, [supportedIds]);
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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8 selection:bg-emerald-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/5 via-background to-background"></div>
      <div className="mx-auto max-w-7xl space-y-10">
        <AppHeader />

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="premium-glass relative overflow-hidden rounded-3xl p-10 lg:p-12">
            <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>
            <div className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-500">
              {t.autScrow}
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl lg:text-7xl text-gradient leading-[1.1] pb-2">
              {t.mission}
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-muted-foreground leading-relaxed">
              {t.mission1}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#create"
                className="premium-btn rounded-full px-8 py-4 font-bold text-lg"
              >
                {t.createProposal}
              </a>

              <a
                href="#proposals"
                className="rounded-full border border-border bg-card/50 px-8 py-4 font-bold text-foreground transition-all hover:bg-accent hover:text-accent-foreground backdrop-blur-md shadow-sm"
              >
                {t.exploreProposals}
              </a>
            </div>
          </div>

          <div className="premium-glass rounded-3xl p-10 flex flex-col justify-center">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground">{t.howItWorks}</h2>

            <div className="space-y-4">
              <div className="group rounded-2xl border border-border bg-background/50 p-5 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-500">1</span>
                  {t.step1}
                </p>
                <p className="mt-2 pl-8 text-sm text-muted-foreground leading-relaxed">{t.step11}</p>
              </div>

              <div className="group rounded-2xl border border-border bg-background/50 p-5 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-500">2</span>
                  {t.step2}
                </p>
                <p className="mt-2 pl-8 text-sm text-muted-foreground leading-relaxed">{t.step21}</p>
              </div>

              <div className="group rounded-2xl border border-border bg-background/50 p-5 transition-all hover:bg-card hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-500">3</span>
                  {t.step3}
                </p>
                <p className="mt-2 pl-8 text-sm text-muted-foreground leading-relaxed">{t.step31}</p>
              </div>
            </div>
          </div>
        </section>

        <StatsBar proposals={proposals} />



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
              <h2 className="text-3xl font-bold text-foreground">{t.proposals}</h2>
              <p className="text-muted-foreground">{t.findnew}</p>
            </div>

            <button
              onClick={() => proposalsQuery.refetch()}
              disabled={proposalsQuery.isFetching}
              className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-all hover:bg-accent disabled:opacity-50"
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
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${filter === item.key
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              type="text"
              placeholder={t.searchProp}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card/50 p-4 outline-none transition focus:border-emerald-500 focus:bg-background"
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-2xl border border-border bg-card/50 p-4 outline-none transition focus:border-emerald-500 focus:bg-background md:w-48"
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
            <div className="rounded-3xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
              {t.conectWallet}
            </div>
          )}

          {wallet.connected &&
            filteredProposals.length === 0 &&
            !proposalsQuery.isLoading && (
              <div className="rounded-3xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
                {t.noProposalsFilter}
              </div>
            )}

          {wallet.connected && proposalsQuery.isLoading && (
            <div className="rounded-3xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
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