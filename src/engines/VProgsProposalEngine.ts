import type {
    CreateProposalInput,
    FundProposalInput,
    ProposalEngine,
    ProposalEngineContext,
    ProposalCommand,
    VerificationResult,
    TxResult,
    SimulationResult,
} from "./proposal-engine.interface";
import type { ProposalId, ProposalView } from "@/core/proposal/proposal.types";
import { VProgVerifier } from "@/core/proposal/commitment/Verifier";

/**
 * vProgs (Virtual Programs) engine stub.
 *
 * vProgs are Kaspa's native smart contract system, currently in development.
 */
export class VProgsProposalEngine implements ProposalEngine {
    readonly chainKind = "vprogs" as const;

    async simulate(
        _ctx: ProposalEngineContext,
        _command: ProposalCommand
    ): Promise<SimulationResult> {
        return { success: true, gasEstimate: "0" };
    }

    async submit(
        ctx: ProposalEngineContext,
        command: ProposalCommand,
    ): Promise<TxResult> {
        switch (command.type) {
            case "proposal.create":
                return this.createProposal(ctx, command.input);
            case "proposal.fund":
                return this.fundProposal(ctx, {
                    proposalId: command.proposalId,
                    amount: command.amount,
                    asset: command.asset,
                });
            case "proposal.finalize":
                return this.finalizeProposal(ctx, command.proposalId);
            case "proposal.withdraw":
                return this.withdraw(ctx, command.proposalId);
            case "proposal.withdrawMany":
                return this.withdrawMany(ctx, command.proposalIds);
            default:
                throw new Error(`VProgsEngine: unknown command type`);
        }
    }

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

    async verify(
        _proposalId: ProposalId, 
        _provider?: any
    ): Promise<VerificationResult> {
        return { status: "unsupported", reason: "vProgs Verification requires proposal metadata" };
    }

    validateAddress(address: string): { valid: boolean; error?: string } {
        // vProgs identifiers can be varied, for now we support kaspa: or hash-like strings
        if (address.startsWith("kaspa:") || address.length === 64) {
            return { valid: true };
        }
        return { valid: false, error: "Invalid vProg identifier (must be kaspa: address or 64-char hash)" };
    }

    // Read methods (legacy/internal)
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
