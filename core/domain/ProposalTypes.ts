export type Address = `0x${string}`;

export type ProposalAsset =
  | { type: "native" }
  | { type: "krc20"; tokenAddress: Address };