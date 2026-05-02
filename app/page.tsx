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
import { ProposalSkeleton, StatsSkeleton } from "../components/proposal/ProposalSkeleton";
import { AppHeader } from "../components/layout/AppHeader";
import { SortDropdown, SortOption } from "../components/ui/SortDropdown";

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

        <section className="space-y-8">
          <div className="premium-glass relative overflow-hidden rounded-[3rem] p-12 lg:p-20 text-center">
            <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]"></div>
            <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-8 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-2 text-sm font-black uppercase tracking-widest text-emerald-500">
                ✨ {t.autScrow}
              </div>

              <h1 className="max-w-5xl text-5xl font-black tracking-tighter md:text-7xl lg:text-8xl text-gradient leading-[0.95] pb-4">
                {t.mission}
              </h1>
              
              <p className="mt-8 max-w-2xl text-xl text-muted-foreground leading-relaxed">
                {t.mission1}
              </p>

              <div className="mt-12 flex flex-wrap justify-center gap-6">
                <a
                  href="#create"
                  className="premium-btn min-w-[200px] rounded-full px-10 py-5 font-bold text-xl transition-all hover:scale-105 active:scale-95"
                >
                  {t.createProposal}
                </a>

                <a
                  href="#proposals"
                  className="rounded-full border border-border bg-background/50 px-10 py-5 font-bold text-xl text-foreground transition-all hover:bg-accent backdrop-blur-md shadow-sm hover:scale-105 active:scale-95"
                >
                  {t.exploreProposals}
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: "1", title: t.step1, desc: t.step11, icon: "💡" },
              { step: "2", title: t.step2, desc: t.step21, icon: "💎" },
              { step: "3", title: t.step3, desc: t.step31, icon: "⚡" },
            ].map((s) => (
              <div key={s.step} className="premium-glass group rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl shadow-inner ring-1 ring-emerald-500/20">
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  <span className="mr-2 text-emerald-500 opacity-50">0{s.step}.</span>
                  {s.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {proposalsQuery.isLoading ? (
          <StatsSkeleton />
        ) : (
          <StatsBar proposals={proposals} />
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

          <div className="premium-glass relative z-30 flex flex-col gap-4 rounded-3xl p-6 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t.searchProp}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="premium-glass h-14 w-full rounded-2xl p-4 pl-12 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 shadow-sm"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                🔍
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <SortDropdown
                value={sort}
                onChange={(val) => setSort(val as Sort)}
                labels={{
                  newest: t.newest,
                  raised: t.moreRe,
                  ending: t.endSoon,
                }}
              />

              <div className="relative md:w-48">
                <input
                  className="premium-glass h-14 w-full rounded-2xl p-4 pl-12 pr-4 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 font-bold text-foreground placeholder:text-muted-foreground/50 shadow-sm"
                  placeholder={`${t.fundingFor}`}
                  value={fundAmount}
                  onChange={(event) => setFundAmount(event.target.value)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500">
                  {NETWORK.currency}
                </div>
              </div>
            </div>
          </div>

          {!wallet.connected && (
            <div className="rounded-3xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
              {t.conectWallet}
            </div>
          )}

          {wallet.connected &&
            filteredProposals.length === 0 &&
            !proposalsQuery.isLoading && (
              <div className="premium-glass rounded-3xl p-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20 text-3xl">
                  📂
                </div>
                <h3 className="text-xl font-bold text-foreground">{t.noProposalsFilter}</h3>
                <p className="mt-2 text-muted-foreground">Prueba ajustando los filtros o crea una nueva propuesta.</p>
              </div>
            )}

          {proposalsQuery.isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <ProposalSkeleton key={i} />
              ))}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProposals.map((proposal, index) => (
              <div 
                key={proposal.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProposalCard
                  proposal={proposal}
                  fundAmount={fundAmount}
                  loading={isAnyMutationPending}
                  connected={wallet.connected}
                  isSupported={supportedIdsSet.has(proposal.id)}
                  onFund={handleFund}
                  onFinalize={handleFinalize}
                  onWithdraw={handleWithdraw}
                />
              </div>
            ))}
          </div>

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