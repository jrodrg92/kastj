import type { 
    ChainKind, 
    ProposalId, 
    ProposalView, 
    ProposalAsset,
    SettlementMode
} from "@/core/proposal/proposal.types";

import type { JsonRpcSigner, BrowserProvider } from "ethers";

export type { ChainKind, ProposalId, ProposalView, ProposalAsset };

// ─── Engine context ───

export type WalletSigner = JsonRpcSigner | { getAddress: () => Promise<string> } | unknown;
export type WalletProvider = BrowserProvider | { getNetwork: () => Promise<any> } | unknown;

export interface ProposalEngineContext {
    chain: ChainKind;
    account: string;
    signer?: WalletSigner;
    provider?: WalletProvider;
    onProgress?: (status: { 
        state: "signing" | "processing"; 
        step: "approve" | "submit" | "pending" | "confirmed" | "indexed" | "verified"; 
        txHash?: string; 
        message?: string 
    }) => void;
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
    settlementMode?: SettlementMode;
}

export interface FundProposalInput {
    proposalId: ProposalId;
    asset: ProposalAsset;
    amount: string; // human decimal
}

// ─── Phase 4: Command-based architecture ───

export type ProposalCommand =
    | { type: "proposal.create"; input: CreateProposalInput }
    | { type: "proposal.fund"; proposalId: ProposalId; amount: string; asset: ProposalAsset }
    | { type: "proposal.finalize"; proposalId: ProposalId }
    | { type: "proposal.withdraw"; proposalId: ProposalId }
    | { type: "proposal.withdrawMany"; proposalIds: ProposalId[] };

export interface SimulationResult {
    success: boolean;
    gasEstimate?: string;
    error?: string;
    payload?: any;
}

export type VerificationResult =
  | { status: "verified"; checks: string[]; timestamp: number }
  | { status: "failed"; reason: string; timestamp: number }
  | { status: "unsupported"; reason: string };

/**
 * Principal ProposalEngine Interface
 * Standardized across all Kaspa layers (zkEVM, L1, vProgs).
 */
export interface ProposalEngine {
    readonly chainKind: ChainKind;

    /**
     * Simulates a command execution without submitting a transaction.
     * Crucial for UX safety and gas estimation.
     */
    simulate(
        ctx: ProposalEngineContext,
        command: ProposalCommand
    ): Promise<SimulationResult>;

    /**
     * Submits a command for execution on the target chain.
     */
    submit(
        ctx: ProposalEngineContext,
        command: ProposalCommand,
    ): Promise<TxResult>;

    verify(
        proposalId: ProposalId, 
        provider?: any
    ): Promise<VerificationResult>;

    /**
     * Validates an address format according to engine rules.
     */
    validateAddress(address: string): { valid: boolean; error?: string };

    // --- Legacy compatibility (deprecated) ---
    getProposal?(proposalId: ProposalId, provider?: any): Promise<ProposalView>;
    listProposals?(): Promise<ProposalView[]>;
}
