"use client";

import { ProposalCard } from "@/components/proposal/ProposalCard";
import { ProposalSkeleton } from "@/components/proposal/ProposalSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProposalView } from "@/core/proposal/proposal.types";

interface Props {
  proposals: ProposalView[];
  isLoading: boolean;
  isError: boolean;
  isAnyMutationPending: boolean;
  walletConnected: boolean;
  supportedIdsSet: Set<number>;
  fundAmount: string;
  onFund: (id: number) => Promise<void>;
  onFinalize: (id: number) => Promise<void>;
  onWithdraw: (id: number) => Promise<void>;
  t: any;
}

export function ExplorerGrid({
  proposals,
  isLoading,
  isError,
  isAnyMutationPending,
  walletConnected,
  supportedIdsSet,
  fundAmount,
  onFund,
  onFinalize,
  onWithdraw,
  t
}: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <ProposalSkeleton key={i} />)}
      </div>
    );
  }

  if (isError || proposals.length === 0) {
    return (
      <EmptyState 
        title={t.noProposalsFilter} 
        description={t.tryAdjustFilters} 
        className="my-12"
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {proposals.map((proposal, index) => (
        <div 
          key={proposal.id} 
          className="animate-in fade-in slide-in-from-bottom-4 duration-500" 
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ProposalCard
            proposal={proposal}
            fundAmount={fundAmount}
            loading={isAnyMutationPending}
            connected={walletConnected}
            isSupported={supportedIdsSet.has(proposal.id)}
            onFund={onFund}
            onFinalize={onFinalize}
            onWithdraw={onWithdraw}
          />
        </div>
      ))}
    </div>
  );
}
