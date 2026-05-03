"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useWalletContext } from "@/contexts/WalletContext";
import { useProposalEngine } from "@/hooks/useProposalEngine";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { ProposalCard } from "@/components/proposal/ProposalCard";
import { ProposalSkeleton, StatsSkeleton } from "@/components/proposal/ProposalSkeleton";
import { AppHeader } from "@/components/layout/AppHeader";
import { SortDropdown } from "@/components/ui/SortDropdown";
import { Search, Coins, Plus, RefreshCw } from "lucide-react";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { NETWORK } from "@/lib/network";
import { supabase } from "@/lib/supabase-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInfiniteProposals } from "@/features/proposals/hooks/useInfiniteProposals";
import { useFundProposal } from "@/features/proposals/hooks/useFundProposal";
import { useFinalizeProposal } from "@/features/proposals/hooks/useFinalizeProposal";
import { useWithdrawProposal } from "@/features/proposals/hooks/useWithdrawProposal";
import { parseMetadataUri } from "@/lib/proposalUtils";
import Link from "next/link";

type Filter = "all" | "active" | "mine" | "supported" | "succeeded" | "failed";
type Sort = "newest" | "raised" | "ending";

function metadataText(metadataURI?: string | null) {
  const metadata = parseMetadataUri(metadataURI);
  if (!metadata) return "";
  return `${metadata.title} ${metadata.description}`.toLowerCase();
}

export function ExplorerClient() {
  const wallet = useWalletContext();
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);
  const { t } = useLanguage();
  const proposalsQuery = useInfiniteProposals();

  const proposals = useMemo(
    () => proposalsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [proposalsQuery.data],
  );

  useRealtimeNotifications(wallet.address);

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && proposalsQuery.hasNextPage && !proposalsQuery.isFetchingNextPage) {
        void proposalsQuery.fetchNextPage();
      }
    },
    [proposalsQuery],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const fundMutation = useFundProposal(ctx);
  const finalizeMutation = useFinalizeProposal(ctx);
  const withdrawMutation = useWithdrawProposal(ctx);

  const isAnyMutationPending = fundMutation.isPending || finalizeMutation.isPending || withdrawMutation.isPending;

  const [filter, setFilter] = useState<Filter>("all");
  const [supportedIds, setSupportedIds] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");
  const [fundAmount, setFundAmount] = useState("1");

  const supportedIdsSet = useMemo(() => new Set(supportedIds), [supportedIds]);

  const filteredProposals = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return proposals
      .filter((proposal) => {
        if (filter === "active" && proposal.status !== 0) return false;
        if (filter === "mine") return proposal.creator.toLowerCase() === wallet.address?.toLowerCase();
        if (filter === "supported") return supportedIdsSet.has(proposal.id);
        if (filter === "succeeded" && proposal.status !== 1) return false;
        if (filter === "failed" && proposal.status !== 2) return false;
        if (!normalizedSearch) return true;
        return metadataText(proposal.metadataURI).includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sort === "raised") {
            const valA = BigInt(a.totalRaisedRaw || "0");
            const valB = BigInt(b.totalRaisedRaw || "0");
            if (valA < valB) return 1;
            if (valA > valB) return -1;
            return 0;
        }
        if (sort === "ending") return Number(a.deadline) - Number(b.deadline);
        return Number(b.id) - Number(a.id);
      });
  }, [filter, proposals, search, sort, supportedIdsSet, wallet.address]);

  async function loadMySupportedProposals() {
    if (!wallet.address) return;
    const { data } = await supabase
      .from("fundings")
      .select("proposal_id")
      .eq("supporter", wallet.address)
      .eq("withdrawn", false); // Solo las que NO han sido retiradas
    const ids = Array.from(new Set((data ?? []).map((item) => Number(item.proposal_id))));
    setSupportedIds(ids);
  }

  useEffect(() => {
    if (!wallet.connected) return;
    void (async () => {
      await proposalsQuery.refetch();
      await loadMySupportedProposals();
    })();
  }, [wallet.connected, wallet.address]);

  async function handleFund(id: number) {
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) return;
    try {
      await fundMutation.mutateAsync({ proposalId: id, asset: proposal.asset, amount: fundAmount });
      await loadMySupportedProposals();
    } catch (e) { }
  }

  async function handleFinalize(id: number) {
    try {
      await finalizeMutation.mutateAsync(id);
      await loadMySupportedProposals();
    } catch (e) { }
  }

  async function handleWithdraw(id: number) {
    try {
      await withdrawMutation.mutateAsync(id);
      await loadMySupportedProposals();
    } catch (e) { }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25">
      <AppHeader />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{t.exploreProposals}</h1>
            <p className="text-muted-foreground">{t.exploreProposalsDesc}</p>
          </div>

          <Link
            href="/proposals/create"
            className="premium-btn flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-lg shadow-cyan-500/10 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            {t.createProposal}
          </Link>
        </header>

        <ScrollReveal>
          {proposalsQuery.isLoading ? <StatsSkeleton /> : <StatsBar />}
        </ScrollReveal>

        {/* ─── FILTERS & SEARCH ─── */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-fit">
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
                className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all ${filter === item.key
                  ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="premium-glass flex flex-col gap-4 rounded-[2rem] p-4 md:flex-row md:items-center border-white/[0.04] bg-background/20 backdrop-blur-xl">
            <div className="group relative flex-1">
              <input
                type="text"
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-14 w-full rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 pl-12 text-sm text-foreground outline-none transition-all focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-cyan-500" size={20} />
            </div>

            <div className="flex flex-wrap gap-3">
              <SortDropdown
                value={sort}
                onChange={(val) => setSort(val as Sort)}
                labels={{ newest: t.newest, raised: t.moreRe, ending: t.endSoon }}
              />

              <div className="group relative md:w-44">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-cyan-500" size={18} />
                <input
                  className="h-14 w-full rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 pl-11 pr-12 text-sm font-bold text-foreground outline-none transition-all focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder={t.minAmount}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40">{NETWORK.currency}</div>
              </div>

              <button
                onClick={() => proposalsQuery.refetch()}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.02] text-muted-foreground transition-all hover:bg-white/[0.05] hover:text-cyan-500 active:rotate-180 duration-500"
              >
                <RefreshCw size={20} className={proposalsQuery.isFetching ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* ─── GRID ─── */}
          {proposalsQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <ProposalSkeleton key={i} />)}
            </div>
          ) : proposalsQuery.isError ? (
            <EmptyState 
              title={t.noProposalsFilter} 
              description={t.tryAdjustFilters} 
              className="my-12"
            />
          ) : filteredProposals.length === 0 ? (
            <EmptyState title={t.noProposalsFilter} description={t.tryAdjustFilters} className="my-12" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProposals.map((proposal, index) => (
                <div key={proposal.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
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
          )}

          <div ref={loadMoreRef} className="py-12 flex justify-center">
            {proposalsQuery.isFetchingNextPage && <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
