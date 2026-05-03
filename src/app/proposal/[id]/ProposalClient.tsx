"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Loader2 } from "lucide-react";

// Contexts & Hooks
import { useWalletContext } from "@/contexts/WalletContext";
import { useUi } from "@/contexts/UiContext";
import { useProposalEngine } from "@/hooks/useProposalEngine";
import { useProposal } from "@/features/proposals/hooks/useProposal";
import { useProposalActivity } from "@/features/proposals/hooks/useProposalActivity";
import { useProposalFundings } from "@/features/proposals/hooks/useProposalFundings";
import { useProposalMetadata } from "@/features/proposals/hooks/useProposalMetadata";
import { useProposalSync } from "@/features/proposals/hooks/useProposalSync";
import { useProposalDerivedState } from "@/features/proposals/hooks/useProposalDerivedState";
import { useVerifyProposal } from "@/features/proposals/hooks/useVerifyProposal";

// Mutations
import { useFundProposal } from "@/features/proposals/hooks/useFundProposal";
import { useFinalizeProposal } from "@/features/proposals/hooks/useFinalizeProposal";
import { useWithdrawProposal } from "@/features/proposals/hooks/useWithdrawProposal";

// Sub-components
import { ProposalHeader } from "@/components/proposal/details/ProposalHeader";
import { ProposalDescription } from "@/components/proposal/details/ProposalDescription";
import { ProposalActivityFeed } from "@/components/proposal/details/ProposalActivityFeed";
import { ProposalProgress } from "@/components/proposal/details/ProposalProgress";
import { ProposalFundingPanel } from "@/components/proposal/details/ProposalFundingPanel";
import { ProposalLifecycle } from "@/components/proposal/details/ProposalLifecycle";
import { ProposalTrustPanel } from "@/components/proposal/details/ProposalTrustPanel";

export default function ProposalClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const wallet = useWalletContext();
  const { t } = useUi();
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);

  const id = params?.id;
  const proposalId = Number(id);
  const txFromUrl = searchParams.get('tx');
  const isPending = isNaN(proposalId) || proposalId < 0;

  // 1. Data Fetching
  const { data: proposal, isLoading: isProposalLoading } = useProposal(proposalId);
  const { data: activity = [] } = useProposalActivity(proposalId);
  const { data: fundings = [] } = useProposalFundings(proposalId);
  const metadata = useProposalMetadata(proposal?.metadataURI);

  // 2. Realtime & Sync Logic
  useProposalSync({ id: id || "", proposalId, isPending, txHash: proposal?.tx_hash || txFromUrl });

  // 3. Mutations & Verification
  const fundMutation = useFundProposal(ctx);
  const finalizeMutation = useFinalizeProposal(ctx);
  const withdrawMutation = useWithdrawProposal(ctx);
  const { verify, isVerifying, isVerified, result } = useVerifyProposal(ctx);

  const isMutating = fundMutation.isPending || finalizeMutation.isPending || withdrawMutation.isPending;

  // 4. Derived State
  const derived = useProposalDerivedState(proposal, fundings, wallet);

  const displayMetadata = useMemo(() => {
    if (proposal) return { 
      title: metadata.title || proposal.title || "", 
      description: metadata.description || proposal.description || "" 
    };
    return { title: t.loading || "Loading...", description: "" };
  }, [proposal, metadata, t.loading]);

  if (isProposalLoading && !isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <ScrollReveal>
          {/* Header Section */}
          <ProposalHeader 
            title={displayMetadata.title}
            creator={proposal?.creator || ""}
            status={proposal?.status || "active"}
            t={t}
          />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Details & Activity */}
            <div className="lg:col-span-8">
              <ProposalDescription 
                description={displayMetadata.description} 
                t={t} 
              />
              
              <ProposalActivityFeed 
                proposalId={proposalId}
                activity={activity}
                fundings={fundings}
                currentWallet={wallet.address}
                creatorWallet={proposal?.creator || ""}
                recipientWallet={proposal?.recipient || ""}
                t={t}
              />
            </div>

            {/* Right Column: Actions & Stats */}
            <div className="lg:col-span-4">
              {proposal && derived && (
                <div className="premium-glass sticky top-24 flex flex-col gap-8 rounded-[2.5rem] border-white/[0.05] p-8 shadow-2xl">
                   {/* Stats Area */}
                   <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t.totalRaised || "Total Raised"}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{proposal.totalRaised.value || "0"}</span>
                        <span className="text-sm font-medium text-cyan-500">{proposal.asset.symbol}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t.goal || "Goal"}</p>
                      <p className="text-xl font-semibold text-white">{proposal.goal.value} {proposal.asset.symbol}</p>
                    </div>
                  </div>

                  {/* 1. Progress Panel */}
                  <ProposalProgress 
                    progress={derived.progress}
                    contributors={fundings.length}
                    t={t}
                  />

                  {/* 2. Funding Panel */}
                  <ProposalFundingPanel 
                    status={proposal.status}
                    isExpired={derived.isExpired}
                    isMutating={isMutating}
                    walletConnected={wallet.connected}
                    t={t}
                    onFund={(amount) => fundMutation.mutate({ proposalId, amount, asset: proposal.asset })}
                  />

                  {/* 3. Lifecycle Panel */}
                  <ProposalLifecycle 
                    status={proposal.status}
                    isExpired={derived.isExpired}
                    canFinalize={derived.canFinalize}
                    canWithdraw={derived.canWithdraw}
                    isMutating={isMutating}
                    t={t}
                    onFinalize={() => finalizeMutation.mutate(proposalId)}
                    onWithdraw={() => withdrawMutation.mutate(proposalId)}
                  />

                  {/* 4. Trust Panel */}
                  <ProposalTrustPanel 
                    onVerify={() => verify(proposal)}
                    isVerifying={isVerifying}
                    isVerified={isVerified}
                    result={result}
                    t={t}
                  />

                  {/* Extra Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Minimum Threshold</p>
                      <p className="text-sm font-semibold text-white">{proposal.minThreshold.value} {proposal.asset.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(derived.deadlineMs).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </main>

      <SiteFooter />
    </div>
  );
}