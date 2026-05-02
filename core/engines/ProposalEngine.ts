export type ChainKind = "mock" | "kasplex-zkevm" | "kaspa-l1" | "vprogs";

export type ProposalId = string | number;

export type Amount = {
  value: string; // decimal humano: "10.5"
  decimals: number;
  symbol: string;
};

export type Asset =
  | {
      type: "native";
      symbol: string;
      decimals: number;
    }
  | {
      type: "token";
      symbol: string;
      decimals: number;
      address: string;
    };

export type ProposalStatus =
  | "draft"
  | "active"
  | "succeeded"
  | "failed"
  | "executed"
  | "cancelled";

export interface ProposalEngineContext {
  chain: ChainKind;
  account: string;
  signer?: unknown;
  provider?: unknown;
}

export interface TxResult {
  txId: string;
  explorerUrl?: string;
}

export interface CreateProposalInput {
  title: string;
  description: string;
  recipient: string;
  asset: Asset;
  goal: Amount;
  minThreshold: Amount;
  deadline: Date;
  metadataURI?: string;
}

export interface FundProposalInput {
  proposalId: ProposalId;
  amount: Amount;
}

export interface ProposalView {
  id: ProposalId;
  creator: string;
  recipient: string;
  title: string;
  description: string;
  asset: Asset;
  goal: Amount;
  minThreshold: Amount;
  totalRaised: Amount;
  deadline: Date;
  status: ProposalStatus;
  canWithdraw: boolean;
  canFinalize: boolean;
  status: ProposalStatus;
  canWithdraw: boolean;
  canFinalize: boolean;
}

export interface ProposalEngine {
  readonly kind: ChainKind;

  createProposal(
    ctx: ProposalEngineContext,
    input: CreateProposalInput
  ): Promise<TxResult>;

  fundProposal(
    ctx: ProposalEngineContext,
    input: FundProposalInput
  ): Promise<TxResult>;

  finalizeProposal(
    ctx: ProposalEngineContext,
    proposalId: ProposalId
  ): Promise<TxResult>;

  withdraw(
    ctx: ProposalEngineContext,
    proposalId: ProposalId
  ): Promise<TxResult>;

  getProposal(proposalId: ProposalId): Promise<ProposalView>;

  listProposals(): Promise<ProposalView[]>;
}