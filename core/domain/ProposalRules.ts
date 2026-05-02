import { ProposalView } from "@/core/engines/types";

export function hasReachedThreshold(proposal: ProposalView): boolean {
  return Number(proposal.totalRaised.value) >= Number(proposal.minThreshold.value);
}

export function hasExpired(proposal: ProposalView, now = new Date()): boolean {
  return proposal.deadline.getTime() <= now.getTime();
}

export function canFinalizeProposal(proposal: ProposalView, now = new Date()): boolean {
  if (proposal.status !== "active") return false;

  return hasExpired(proposal, now) || hasReachedThreshold(proposal);
}

export function canWithdrawFromProposal(proposal: ProposalView): boolean {
  return proposal.status === "failed" && proposal.canWithdraw;
}