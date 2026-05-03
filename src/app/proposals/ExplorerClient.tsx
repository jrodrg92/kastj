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
import { ExplorerFilters } from "./ExplorerFilters";
import { ExplorerGrid } from "./ExplorerGrid";

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
        if (filter === "active" && proposal.status !== "active") return false;
        if (filter === "mine") return proposal.creator.toLowerCase() === wallet.address?.toLowerCase();
        if (filter === "supported") return supportedIdsSet.has(proposal.id);
        if (filter === "succeeded" && proposal.status !== "succeeded") return false;
        if (filter === "failed" && proposal.status !== "failed") return false;
        if (!normalizedSearch) return true;
        return metadataText(proposal.metadataURI).includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sort === "raised") {
            const valA = BigInt(a.totalRaised.raw);
            const valB = BigInt(b.totalRaised.raw);
            if (valA < valB) return 1;
            if (valA > valB) return -1;
            return 0;
        }
        if (sort === "ending") return a.deadline - b.deadline;
        return b.id - a.id;
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

        <ExplorerFilters 
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            sort={sort}
            setSort={setSort}
            fundAmount={fundAmount}
            setFundAmount={setFundAmount}
            isFetching={proposalsQuery.isFetching}
            onRefresh={() => proposalsQuery.refetch()}
            t={t}
        />

        <ExplorerGrid 
            proposals={filteredProposals}
            isLoading={proposalsQuery.isLoading}
            isError={proposalsQuery.isError}
            isAnyMutationPending={isAnyMutationPending}
            walletConnected={wallet.connected}
            supportedIdsSet={supportedIdsSet}
            fundAmount={fundAmount}
            onFund={handleFund}
            onFinalize={handleFinalize}
            onWithdraw={handleWithdraw}
            t={t}
        />

        <div ref={loadMoreRef} className="py-12 flex justify-center">
          {proposalsQuery.isFetchingNextPage && <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
