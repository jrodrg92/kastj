export type Address = `0x${string}`;

export type ProposalAsset =
  | { type: "native" }
  | { type: "krc20"; tokenAddress: Address };

export type ProposalStatus = "active" | "succeeded" | "failed";

export interface ProposalAmount {
  value: string; // "1.5"
  symbol: string; // "KAS"
  decimals: number;
}

export interface ProposalView {
  id: number;
  creator: Address;
  recipient: Address;

  asset: ProposalAsset;

  goal: ProposalAmount;
  minThreshold: ProposalAmount;
  totalRaised: ProposalAmount;

  deadline: Date;

  status: ProposalStatus;

  metadataURI?: string;

  // IMPORTANTE: estos vienen del engine/indexer
  canFinalize: boolean;
  canWithdraw: boolean;
}