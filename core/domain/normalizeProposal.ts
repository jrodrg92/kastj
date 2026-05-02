import { ProposalView } from "@/core/engines/types";
import { canFinalizeProposal, canWithdrawFromProposal } from "./ProposalRules";

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
    const goal = Number(proposal.goal.value);
    const raised = Number(proposal.totalRaised.value);

    return {
        ...proposal,
        ui: {
            isActive: proposal.status === "active",
            isSucceeded: proposal.status === "succeeded",
            isFailed: proposal.status === "failed",
            isExpired: proposal.deadline.getTime() <= now.getTime(),
            progressPercent: goal > 0 ? Math.min((raised / goal) * 100, 100) : 0,
            canFinalize: canFinalizeProposal(proposal, now),
            canWithdraw: canWithdrawFromProposal(proposal),
        },
    };
}
