// ─── Canonical types for all proposal engines ───

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

// ─── Engine context ───

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

// ─── Engine inputs ───

export interface CreateProposalInput {
    recipient: string;
    asset: ProposalAsset;
    goal: string; // human decimal
    minThreshold: string; // human decimal
    durationSeconds: number;
    metadataURI: string;
}

export interface FundProposalInput {
    proposalId: ProposalId;
    asset: ProposalAsset;
    amount: string; // human decimal
}

// ─── Engine output (internal view) ───

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

// ─── Engine interface ───

export interface ProposalEngine {
    readonly kind: ChainKind;

    createProposal(
        ctx: ProposalEngineContext,
        input: CreateProposalInput,
    ): Promise<TxResult>;

    fundProposal(
        ctx: ProposalEngineContext,
        input: FundProposalInput,
    ): Promise<TxResult>;

    finalizeProposal(
        ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult>;

    withdraw(
        ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult>;

    withdrawMany(
        ctx: ProposalEngineContext,
        proposalIds: ProposalId[],
    ): Promise<TxResult>;

    getProposal(proposalId: ProposalId): Promise<ProposalView>;

    listProposals(): Promise<ProposalView[]>;

    /**
     * Verifies the integrity of a proposal's escrow (vProg/Contract).
     * Returns true if the on-chain logic matches the expected rules.
     */
    verifyProposal(proposal: ProposalView): Promise<boolean>;
}
