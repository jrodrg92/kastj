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
import { parseUnits } from "@/lib/currencyUtils";
import type { UTXO, UTXOTransactionBuilder } from "./utxo";
import { VProgVerifier } from "@/core/proposal/commitment/Verifier";

/**
 * Kaspa L1 engine.
 *
 * Interacts with Kaspa L1 using UTXO-based escrow scripts.
 * Abstracts the complexity of UTXO selection and script building
 * via the UTXOTransactionBuilder interface.
 */
export class KaspaL1ProposalEngine implements ProposalEngine {
    readonly chainKind = "kaspa-l1" as const;

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
                throw new Error(`KaspaL1Engine: unknown command type`);
        }
    }

    constructor(private builder?: UTXOTransactionBuilder) {}

    async createProposal(
        ctx: ProposalEngineContext,
        input: CreateProposalInput,
    ): Promise<TxResult> {
        console.log("Creating Kaspa L1 proposal (UTXO based)...");

        if (!this.builder) {
            throw new Error("KaspaL1ProposalEngine: UTXO builder not configured.");
        }

        const utxos = await this.fetchAccountUtxos(ctx.account);
        const durationSeconds = BigInt(input.durationSeconds);
        const deadline = BigInt(Math.floor(Date.now() / 1000)) + durationSeconds;

        const txToSign = await this.builder.buildEscrowLock(
            utxos,
            ctx.account, // change address
            input.recipient,
            {
                minThreshold: parseUnits(input.minThreshold, 8),
                lockTime: Number(deadline),
                allowedSigners: ["PLATFORM_PUBKEY_HERE"], 
            }
        );

        const signedTx = await this.signWithKaspaWallet(ctx, txToSign);
        const txId = await this.broadcastKaspaTransaction(signedTx);

        return { txId };
    }

    private async fetchAccountUtxos(_address: string): Promise<UTXO[]> {
        return [];
    }

    private async signWithKaspaWallet(ctx: ProposalEngineContext, tx: string): Promise<string> {
        if (typeof (ctx as any).signKaspaTransaction === "function") {
            return (ctx as any).signKaspaTransaction(tx);
        }
        throw new Error("Kaspa signature provider not found in context");
    }

    private async broadcastKaspaTransaction(_signedTx: string): Promise<string> {
        return "kaspa-tx-id-stub";
    }

    async fundProposal(
        ctx: ProposalEngineContext,
        input: FundProposalInput,
    ): Promise<TxResult> {
        if (!this.builder) {
            throw new Error("KaspaL1ProposalEngine: UTXO builder not configured.");
        }

        if (!ctx.account) {
            throw new Error("KaspaL1ProposalEngine: Account required for funding.");
        }

        const amount = parseUnits(input.amount, 8);
        console.log(`Building native Kaspa transaction for ${amount} sompi`);
        
        throw new Error("KaspaL1ProposalEngine.fundProposal: requires wallet integration for UTXO signing.");
    }

    async finalizeProposal(
        _ctx: ProposalEngineContext,
        _proposalId: ProposalId,
    ): Promise<TxResult> {
        throw new Error(
            "KaspaL1ProposalEngine.finalizeProposal: requires multi-sig release script.",
        );
    }

    async withdraw(
        _ctx: ProposalEngineContext,
        _proposalId: ProposalId,
    ): Promise<TxResult> {
        throw new Error(
            "KaspaL1ProposalEngine.withdraw: requires refund script execution.",
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

    async verify(
        proposalId: ProposalId, 
        provider?: any
    ): Promise<VerificationResult> {
        // This would require fetching the proposal from Supabase first
        // Since verify in the interface now only takes proposalId, 
        // we'd need to fetch the proposal data to verify its L1 script.
        return { status: "unsupported", reason: "L1 Verification requires proposal metadata" };
    }

    // Read methods (legacy/internal)
    async getProposal(_proposalId: ProposalId): Promise<ProposalView> {
        throw new Error(
            "KaspaL1ProposalEngine.getProposal: use Supabase queries.",
        );
    }

    async listProposals(): Promise<ProposalView[]> {
        throw new Error(
            "KaspaL1ProposalEngine.listProposals: use Supabase queries.",
        );
    }
}
