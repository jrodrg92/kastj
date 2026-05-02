import { ProposalStatus } from "../domain/ProposalStateMachine";

export type ExecutionPayouts = {
  recipientAmount: bigint;
  creatorReward: bigint;
  platformFee: bigint;
};

export type ExecutionResult = {
  proposalId: number;
  status: ProposalStatus.Successful | ProposalStatus.Failed;
  payouts?: ExecutionPayouts;
  proof?: string;
};

export interface ExecutionEngine {
  evaluate(proposalId: number): Promise<ExecutionResult>;
}