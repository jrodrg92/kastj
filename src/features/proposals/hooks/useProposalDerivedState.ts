"use client";

import { useMemo } from "react";
import { canFinalizeProposal, isExpired as checkExpired } from "@/core/proposal/proposal.rules";
import { VerificationResult } from "@/engines/proposal-engine.interface";

export type TrustState = "indexed" | "pending" | "verified" | "mismatch";

export function useProposalDerivedState(
  proposal: any, 
  fundings: any[], 
  wallet: any,
  verification: VerificationResult | null
) {
  return useMemo(() => {
    if (!proposal) return null;

    // 1. Unify amounts for calculation
    const goalRaw = BigInt(proposal.goal?.raw || 0);
    const minThresholdRaw = BigInt(proposal.minThreshold?.raw || 0);
    
    // Prioritize the confirmed totalRaised from the proposal record
    // but allow fundings as a fallback/real-time update
    const totalRaisedRaw = BigInt(proposal.totalRaised?.raw || 0);
    const fundingsSumRaw = fundings.reduce((sum, f) => sum + BigInt(f.amount || 0), 0n);
    
    const realTimeRaisedRaw = totalRaisedRaw > fundingsSumRaw ? totalRaisedRaw : fundingsSumRaw;
    
    // 2. Calculate progress (with 2 decimal precision)
    const progress = goalRaw > 0n ? Number((realTimeRaisedRaw * 10000n) / goalRaw) / 100 : 0;

    // 3. Check time (already in MS from API)
    const deadlineMs = Number(proposal.deadline);
    const nowMs = Date.now();
      
    const isExpired = checkExpired({ deadlineMs, nowMs });

    // 4. Trust State
    let trustState: TrustState = "indexed";
    if (verification) {
      if (verification.status === "verified") trustState = "verified";
      else if (verification.status === "failed") trustState = "mismatch";
    }

    // 5. Check business rules
    const canFinalize = canFinalizeProposal({
      status: proposal.status as any,
      totalRaised: realTimeRaisedRaw,
      goalAmount: goalRaw,
      minThreshold: minThresholdRaw,
      deadlineMs,
      nowMs,
      settlementMode: proposal.settlementMode || "DeadlineOnly"
    }) && trustState !== "mismatch"; // Block if mismatch

    // 6. Withdrawal rules
    const isCreator = wallet?.address?.toLowerCase() === proposal.creator?.toLowerCase();
    const canWithdraw = ((proposal.status === "succeeded" && isCreator) || 
                        (proposal.status === "failed")) && trustState !== "mismatch";

    const canFund = proposal.status === "active" && !isExpired && trustState !== "mismatch";

    return {
      progress,
      isExpired,
      canFinalize,
      canWithdraw,
      canFund,
      trustState,
      realTimeRaisedRaw,
      deadlineMs
    };
  }, [proposal, fundings, wallet?.address, verification]);
}
