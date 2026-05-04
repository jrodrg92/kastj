"use client";

import { useMemo } from "react";
import { canFinalizeProposal, isExpired as checkExpired } from "@/core/proposal/proposal.rules";

export function useProposalDerivedState(proposal: any, fundings: any[], wallet: any) {
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

    // 4. Check business rules
    const canFinalize = canFinalizeProposal({
      status: proposal.status as any,
      totalRaised: realTimeRaisedRaw,
      goalAmount: goalRaw,
      minThreshold: minThresholdRaw,
      deadlineMs,
      nowMs,
      settlementMode: proposal.settlementMode || "deadline-only"
    });

    // 5. Withdrawal rules (simplified for now)
    const isCreator = wallet?.address?.toLowerCase() === proposal.creator?.toLowerCase();
    const canWithdraw = (proposal.status === "succeeded" && isCreator) || 
                       (proposal.status === "failed");

    return {
      progress,
      isExpired,
      canFinalize,
      canWithdraw,
      realTimeRaisedRaw,
      deadlineMs
    };
  }, [proposal, fundings, wallet?.address]);
}
