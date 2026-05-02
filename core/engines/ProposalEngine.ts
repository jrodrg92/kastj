import type { Address, ProposalAsset } from "../domain/ProposalTypes";

export interface CreateProposalInput {
  recipient: Address;
  asset: ProposalAsset;
  goal: string;
  minThreshold: string;
  durationSeconds: number;
  metadataURI: string;
}

export interface FundProposalInput {
  proposalId: number;
  asset: ProposalAsset;
  amount: string;
}

export interface ProposalView {
  id: bigint;
  creator: Address;
  recipient: Address;
  asset: ProposalAsset;
  goal: bigint;
  minThreshold: bigint;
  deadline: bigint;
  totalRaised: bigint;
  status: number;
  executed: boolean;
  metadataURI: string;
}

export interface ProposalEngine {
  createProposal(signer: unknown, input: CreateProposalInput): Promise<unknown>;
  fundProposal(signer: unknown, input: FundProposalInput): Promise<unknown>;
  finalizeProposal(signer: unknown, proposalId: number): Promise<unknown>;
  withdraw(signer: unknown, proposalId: number): Promise<unknown>;
  withdrawMany(signer: unknown, proposalIds: number[]): Promise<unknown>;
  getProposal(
    providerOrSigner: unknown,
    proposalId: number
  ): Promise<ProposalView>;
  getProposalCount(providerOrSigner: unknown): Promise<bigint>;
}