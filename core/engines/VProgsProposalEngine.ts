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
 * vProgs (Virtual Programs) engine stub.
 *
 * vProgs are Kaspa's native smart contract system, currently in development.
 * This engine will replace the zkEVM bridge once vProgs are live on mainnet.
 *
 * Key differences from zkEVM:
 * - Native KAS instead of wrapped tokens
 * - DAG-based consensus instead of EVM block finality
 * - Kaspa-native wallet signing (no MetaMask)
 * - Potentially different state model (UTXO-based vs account-based)
 *
 * Implementation will require:
 * - vProgs SDK (not yet available)
 * - vProgs contract deployment tooling
 * - Kaspa-native wallet adapter (Kasware / KSPR)
 */
export class VProgsProposalEngine implements ProposalEngine {
    readonly kind = "vprogs" as const;

    async createProposal(
        _ctx: ProposalEngineContext,
        _input: CreateProposalInput,
    ): Promise<TxResult> {
        throw new Error(
            "VProgsProposalEngine.createProposal: not yet implemented. " +
                "Awaiting vProgs SDK release.",
        );
    }

    async fundProposal(
        _ctx: ProposalEngineContext,
        _input: FundProposalInput,
    ): Promise<TxResult> {
        throw new Error(
            "VProgsProposalEngine.fundProposal: not yet implemented. " +
                "Awaiting vProgs SDK release.",
        );
    }

    async finalizeProposal(
        _ctx: ProposalEngineContext,
        _proposalId: ProposalId,
    ): Promise<TxResult> {
        throw new Error(
            "VProgsProposalEngine.finalizeProposal: not yet implemented.",
        );
    }

    async withdraw(
        _ctx: ProposalEngineContext,
        _proposalId: ProposalId,
    ): Promise<TxResult> {
        throw new Error(
            "VProgsProposalEngine.withdraw: not yet implemented.",
        );
    }

    async withdrawMany(
        _ctx: ProposalEngineContext,
        _proposalIds: ProposalId[],
    ): Promise<TxResult> {
        throw new Error(
            "VProgsProposalEngine.withdrawMany: not yet implemented.",
        );
    }

    async getProposal(_proposalId: ProposalId): Promise<ProposalView> {
        throw new Error(
            "VProgsProposalEngine.getProposal: not yet implemented.",
        );
    }

    async listProposals(): Promise<ProposalView[]> {
        throw new Error(
            "VProgsProposalEngine.listProposals: not yet implemented.",
        );
    }
}
