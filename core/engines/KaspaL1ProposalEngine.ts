import type {
    CreateProposalInput,
    FundProposalInput,
    ProposalEngine,
    ProposalEngineContext,
    ProposalId,
    ProposalView,
    TxResult,
} from "./types";

/**
 * Kaspa L1 engine stub.
 *
 * This engine will interact directly with the Kaspa L1 blockchain
 * using UTXO-based transactions and Kaspa-native wallets (Kasware, KSPR).
 *
 * Implementation requires:
 * - kaspa-wasm SDK for transaction construction
 * - KRC-20 standard support for token operations
 * - UTXO-based escrow pattern (multi-sig or time-locked)
 */
export class KaspaL1ProposalEngine implements ProposalEngine {
    readonly kind = "kaspa-l1" as const;

    async createProposal(
        _ctx: ProposalEngineContext,
        _input: CreateProposalInput,
    ): Promise<TxResult> {
        throw new Error(
            "KaspaL1ProposalEngine.createProposal: not yet implemented. " +
                "Requires kaspa-wasm SDK and UTXO escrow pattern.",
        );
    }

    async fundProposal(
        _ctx: ProposalEngineContext,
        _input: FundProposalInput,
    ): Promise<TxResult> {
        throw new Error(
            "KaspaL1ProposalEngine.fundProposal: not yet implemented. " +
                "Requires UTXO construction with lock script.",
        );
    }

    async finalizeProposal(
        _ctx: ProposalEngineContext,
        _proposalId: ProposalId,
    ): Promise<TxResult> {
        throw new Error(
            "KaspaL1ProposalEngine.finalizeProposal: not yet implemented.",
        );
    }

    async withdraw(
        _ctx: ProposalEngineContext,
        _proposalId: ProposalId,
    ): Promise<TxResult> {
        throw new Error(
            "KaspaL1ProposalEngine.withdraw: not yet implemented.",
        );
    }

    async withdrawMany(
        _ctx: ProposalEngineContext,
        _proposalIds: ProposalId[],
    ): Promise<TxResult> {
        throw new Error(
            "KaspaL1ProposalEngine.withdrawMany: not yet implemented.",
        );
    }

    async getProposal(_proposalId: ProposalId): Promise<ProposalView> {
        throw new Error(
            "KaspaL1ProposalEngine.getProposal: not yet implemented.",
        );
    }

    async listProposals(): Promise<ProposalView[]> {
        throw new Error(
            "KaspaL1ProposalEngine.listProposals: not yet implemented.",
        );
    }
}
