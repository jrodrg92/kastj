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
  const { ctx } = useProposalEngine(wallet.address, wallet.signer, wallet.provider);

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
  useProposalSync({
    id: id || "",
    proposalId,
    isPending,
    txHash: proposal?.txHash || txFromUrl,
    proposal
  });

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
          {isPending && (
            <div className="mb-10 animate-pulse rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-cyan-400">
                    {t.syncingWithBlockchain}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {t.syncingDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Header, Details & Activity */}
            <div className="lg:col-span-8">
              <ProposalHeader
                title={displayMetadata.title}
                creator={proposal?.creator || ""}
                status={proposal?.status || "active"}
                t={t}
              />
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
              <aside className="premium-glass sticky top-24 flex flex-col gap-8 rounded-[2.5rem] border-border/50 p-8 shadow-2xl">
                {proposal && derived ? (
                  <>
                    {/* Proposal Cover Image */}
                    <div className="relative mb-6 aspect-square overflow-hidden rounded-3xl border border-white/5 shadow-inner">
                      {proposal.imageUrl ? (
                        <img 
                          src={proposal.imageUrl} 
                          alt={proposal.title}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 backdrop-blur-3xl">
                          <div className="text-cyan-500/20">
                            {/* Placeholder Icon or Pattern */}
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      {/* Subtle Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                    </div>

                    {/* Stats Area */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {t.raisedLabel || "Total Raised"}
                        </p>

                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-foreground">
                            {proposal.totalRaised.value || "0"}
                          </span>
                          <span className="text-sm font-medium text-cyan-500">
                            {proposal.asset.symbol}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-right">
                        <p className="text-sm font-medium text-muted-foreground">
                          {t.goalLabel || "Goal"}
                        </p>

                        <p className="text-xl font-semibold text-foreground">
                          {proposal.goal.value} {proposal.asset.symbol}
                        </p>
                      </div>
                    </div>

                    {/* Progress Panel */}
                    <ProposalProgress
                      progress={derived.progress}
                      contributors={fundings.length}
                      t={t}
                    />

                    {/* Funding Panel */}
                    <ProposalFundingPanel
                      status={proposal.status}
                      isExpired={derived.isExpired}
                      isMutating={isMutating || isPending}
                      walletConnected={wallet.connected}
                      isVerified={isVerified}
                      t={t}
                      onFund={(amount) => {
                        if (isPending) return;

                        fundMutation.mutate({
                          proposalId,
                          amount,
                          asset: proposal.asset,
                        });
                      }}
                    />

                    {/* Lifecycle Panel */}
                    <ProposalLifecycle
                      status={proposal.status}
                      isExpired={derived.isExpired}
                      canFinalize={derived.canFinalize && !isPending}
                      canWithdraw={derived.canWithdraw && !isPending}
                      isMutating={isMutating || isPending}
                      t={t}
                      onFinalize={() => {
                        if (isPending) return;
                        finalizeMutation.mutate(proposalId);
                      }}
                      onWithdraw={() => {
                        if (isPending) return;
                        withdrawMutation.mutate(proposalId);
                      }}
                    />

                    {/* Trust Panel */}
                    <ProposalTrustPanel
                      onVerify={() => !isPending && verify(proposal)}
                      isVerifying={isVerifying}
                      isVerified={isVerified}
                      result={result}
                      isPending={isPending}
                      t={t}
                    />
                  </>
                ) : (
                  <div className="animate-pulse space-y-8">
                    <div className="h-20 rounded-2xl bg-muted/20" />
                    <div className="h-40 rounded-2xl bg-muted/20" />
                    <div className="h-40 rounded-2xl bg-muted/20" />
                  </div>
                )}
              </aside>
            </div>
          </div>
        </ScrollReveal>
      </main>

      <SiteFooter />
    </div>
  );

}