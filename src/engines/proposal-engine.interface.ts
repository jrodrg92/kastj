import type { 
    ChainKind, 
    ProposalId, 
    ProposalView, 
    ProposalAsset 
} from "@/core/proposal/proposal.types";

export type { ChainKind, ProposalId, ProposalView, ProposalAsset };

import type { JsonRpcSigner, BrowserProvider } from "ethers";

// ─── Engine context ───

export type WalletSigner = JsonRpcSigner | { getAddress: () => Promise<string> } | unknown;
export type WalletProvider = BrowserProvider | { getNetwork: () => Promise<any> } | unknown;

export interface ProposalEngineContext {
    chain: ChainKind;
    account: string;
    signer?: WalletSigner;
    provider?: WalletProvider;
    onProgress?: (status: { state: string; txHash?: string; message?: string }) => void;
}

export interface TxResult {
    txId: string;
    explorerUrl?: string;
    proposalId?: string;
}

// ─── Engine inputs ───

export interface CreateProposalInput {
    recipient: string;
    asset: ProposalAsset;
    goal: string; // human decimal
    minThreshold: string; // human decimal
    durationSeconds: number;
    metadataURI: string;
    allowOverfunding?: boolean;
}

export interface FundProposalInput {
    proposalId: ProposalId;
    asset: ProposalAsset;
    amount: string; // human decimal
}

// ─── Engine commands ───

export type ProposalCommand =
    | { type: "CreateProposal"; input: CreateProposalInput }
    | { type: "FundProposal"; proposalId: ProposalId; amount: string; asset: ProposalAsset }
    | { type: "FinalizeProposal"; proposalId: ProposalId; nowMs: number }
    | { type: "Withdraw"; proposalId: ProposalId }
    | { type: "WithdrawMany"; proposalIds: ProposalId[] };

// ─── Engine interface ───

export type VerificationResult =
  | { status: "verified"; checks: string[]; timestamp: number }
  | { status: "failed"; reason: string; timestamp: number }
  | { status: "unsupported"; reason: string };

export interface ProposalEngine {
    readonly kind: ChainKind;

    /**
     * Submits a command for execution. 
     */
    submit(
        ctx: ProposalEngineContext,
        command: ProposalCommand,
    ): Promise<TxResult>;

    // --- Data Access (Read Model) ---

    getProposal(proposalId: ProposalId, provider?: any): Promise<ProposalView>;

    listProposals(): Promise<ProposalView[]>;

    /**
     * Verifies the integrity of a proposal's escrow (vProg/Contract).
     * Compares local state with on-chain source of truth.
     */
    verifyProposal(proposal: ProposalView, provider?: any): Promise<VerificationResult>;

    // --- Legacy methods (for transition) ---

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
}
