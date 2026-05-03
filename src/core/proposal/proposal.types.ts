// ─── Canonical types for all proposal logic ───

export type ChainKind = "mock" | "kasplex-zkevm" | "kaspa-l1" | "vprogs";

export type ProposalId = string | number;

export type Address = `0x${string}`;

export type ProposalAsset =
    | { type: "native"; symbol: "KAS"; decimals: number }
    | { type: "krc20"; tokenAddress: Address; symbol: string; decimals: number };

export type ProposalStatus = "active" | "succeeded" | "failed";

export interface ProposalAmount {
    value: string; // human-readable decimal: "1.5"
    raw: string;   // raw integer value as string (e.g. "150000000")
    symbol: string; // "KAS"
    decimals: number;
}

export interface ProposalView {
    id: ProposalId;
    creator: string;
    recipient: string;
    asset: ProposalAsset;
    goal: ProposalAmount;
    minThreshold: ProposalAmount;
    totalRaised: ProposalAmount;
    deadline: Date;
    status: ProposalStatus;
    metadataURI?: string;
    canFinalize: boolean;
    canWithdraw: boolean;
}
