// ─── Canonical types for all proposal logic ───

export type ChainKind = "mock" | "kasplex-zkevm" | "kaspa-l1" | "vprogs";

export type ProposalId = string | number;

export type Address = string; // No longer restricted to 0x

export type SettlementMode = "DeadlineOnly" | "EarlyIfGoalReached";

export type ProposalAsset =
    | { type: "native"; symbol: "KAS"; decimals: number }
    | { type: "krc20"; tokenAddress: Address; symbol: string; decimals: number };

export type ProposalStatus = "active" | "succeeded" | "failed";

export interface ProposalAmount {
    value: string; // human-readable decimal: "1.5"
    raw: string;   // raw integer value as string (e.g. "1500000000000000000") for serialization
    symbol: string; // "KAS"
    decimals: number;
}

/**
 * Standard view of a proposal for UI and engines.
 */
export interface ProposalView {
    id: number;
    creator: string;
    recipient: string;
    asset: ProposalAsset;
    goal: ProposalAmount;
    minThreshold: ProposalAmount;
    totalRaised: ProposalAmount;
    deadline: number; // timestamp in MS
    status: ProposalStatus;
    settlementMode?: SettlementMode;
    metadataURI?: string | null;
    
    // UI derivation flags
    canFinalize?: boolean;
    canWithdraw?: boolean;
    
    // Extra metadata from DB (optional)
    title?: string | null;
    summary?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    txHash?: string | null;
}
