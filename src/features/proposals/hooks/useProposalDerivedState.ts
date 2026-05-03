"use client";

import { useMemo } from "react";
import { canFinalizeProposal, isExpired as checkExpired } from "@/core/proposal/proposal.rules";

export function useProposalDerivedState(proposal: any, fundings: any[], wallet: any) {
  return useMemo(() => {
    if (!proposal) return null;

    // 1. Unify amounts for calculation
    const goalRaw = BigInt(proposal.goal?.raw || 0);
    const minThresholdRaw = BigInt(proposal.minThreshold?.raw || 0);
    const realTimeRaisedRaw = fundings.reduce((sum, f) => sum + BigInt(f.amount || 0), 0n);
    
    // 2. Calculate progress
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
