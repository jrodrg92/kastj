import type { 
    ChainKind, 
    ProposalId, 
    ProposalView, 
    ProposalAsset 
} from "@/core/proposal/proposal.types";

import type { JsonRpcSigner, BrowserProvider } from "ethers";

// ─── Engine context ───

export type WalletSigner = JsonRpcSigner | any; // 'any' for non-EVM wallets like Kaspa/Mock
export type WalletProvider = BrowserProvider | any;

export interface ProposalEngineContext {
    chain: ChainKind;
    account: string;
    signer?: WalletSigner;
    provider?: WalletProvider;
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

export interface ProposalEngine {
    readonly kind: ChainKind;

    /**
     * Submits a command for execution. 
     * In ZkEVM, this maps to a contract transaction.
     * In vProgs, this might build a proof or submit a commitment.
     */
    submit(
        ctx: ProposalEngineContext,
        command: ProposalCommand,
    ): Promise<TxResult>;

    /**
     * Verification results for a proposal.
     */
    verify?(proposalId: ProposalId): Promise<{
        commitment: string;
        proof?: string;
        valid: boolean;
    }>;

    // --- Data Access (Read Model) ---

    getProposal(proposalId: ProposalId, provider?: any): Promise<ProposalView>;

    listProposals(): Promise<ProposalView[]>;

    /**
     * Verifies the integrity of a proposal's escrow (vProg/Contract).
     * Returns true if the on-chain logic matches the expected rules.
     */
    verifyProposal(proposal: ProposalView, provider?: any): Promise<boolean>;

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
