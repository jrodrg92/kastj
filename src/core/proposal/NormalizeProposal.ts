import type { ProposalView } from "@/core/proposal/proposal.types";
import { canFinalizeProposal, canWithdrawFromProposal } from "./proposal.rules";

export interface NormalizedProposalView extends ProposalView {
    ui: {
        isActive: boolean;
        isSucceeded: boolean;
        isFailed: boolean;
        isExpired: boolean;
        progressPercent: number;
        canFinalize: boolean;
        canWithdraw: boolean;
    };
}

export function normalizeProposalView(
    proposal: ProposalView,
    now = new Date(),
): NormalizedProposalView {
    const rawGoal = BigInt(proposal.goal.raw);
    const rawRaised = BigInt(proposal.totalRaised.raw);

    return {
        ...proposal,
        ui: {
            isActive: proposal.status === "active",
            isSucceeded: proposal.status === "succeeded",
            isFailed: proposal.status === "failed",
            isExpired: proposal.deadline.getTime() <= now.getTime(),
            progressPercent: rawGoal > 0n 
                ? Number((rawRaised * 100n) / rawGoal) 
                : 0,
            canFinalize: canFinalizeProposal(proposal, now),
            canWithdraw: canWithdrawFromProposal(proposal),
        },
    };
}
