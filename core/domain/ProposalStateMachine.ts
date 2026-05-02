export enum ProposalStatus {
  Active = 0,
  Successful = 1,
  Failed = 2,
}

export type ProposalStateInput = {
  totalRaised: bigint;
  threshold: bigint;
  deadline: number;
  now: number;
};

export function resolveProposalStatus({
  totalRaised,
  threshold,
  deadline,
  now,
}: ProposalStateInput): ProposalStatus {
  if (now < deadline) {
    return ProposalStatus.Active;
  }

  if (totalRaised >= threshold) {
    return ProposalStatus.Successful;
  }

  return ProposalStatus.Failed;
}

export function canFundProposal(input: {
  status: ProposalStatus;
  deadline: number;
  now: number;
}): boolean {
  return input.status === ProposalStatus.Active && input.now < input.deadline;
}

export function canFinalizeProposal(input: {
  status: ProposalStatus;
  deadline: number;
  now: number;
}): boolean {
  return input.status === ProposalStatus.Active && input.now >= input.deadline;
}