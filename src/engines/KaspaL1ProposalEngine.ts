import type {
    CreateProposalInput,
    FundProposalInput,
    ProposalEngine,
    ProposalEngineContext,
    ProposalId,
    ProposalView,
    TxResult,
} from "./types";
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
    readonly kind = "kaspa-l1" as const;

    async submit(
        ctx: ProposalEngineContext,
        command: ProposalCommand,
    ): Promise<TxResult> {
        switch (command.type) {
            case "CreateProposal":
                return this.createProposal(ctx, command.input);
            case "FundProposal":
                return this.fundProposal(ctx, {
                    proposalId: command.proposalId,
                    amount: command.amount,
                    asset: command.asset,
                });
            case "FinalizeProposal":
                return this.finalizeProposal(ctx, command.proposalId);
            case "Withdraw":
                return this.withdraw(ctx, command.proposalId);
            case "WithdrawMany":
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

        // 1. Fetch UTXOs for the creator
        // In a real scenario, this would call a Kaspa API or the wallet
        const utxos = await this.fetchAccountUtxos(ctx.account);

        // 2. Build the Escrow Lock Transaction
        // We define the conditions: threshold met AND platform sig OR deadline passed
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

        // 3. Request Signature from Kaspa Wallet (e.g. Kasware)
        const signedTx = await this.signWithKaspaWallet(ctx, txToSign);

        // 4. Broadcast
        const txId = await this.broadcastKaspaTransaction(signedTx);

        return { txId };
    }

    private async fetchAccountUtxos(_address: string): Promise<UTXO[]> {
        // Stub: Fetch from Kaspa API (e.g. https://api.kaspa.org/addresses/{address}/utxos)
        return [];
    }

    private async signWithKaspaWallet(ctx: ProposalEngineContext, tx: string): Promise<string> {
        if (typeof (ctx as any).signKaspaTransaction === "function") {
            return (ctx as any).signKaspaTransaction(tx);
        }
        throw new Error("Kaspa signature provider not found in context");
    }

    private async broadcastKaspaTransaction(_signedTx: string): Promise<string> {
        // Stub: Post to Kaspa API
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

        // Logic for UTXO-based funding:
        // 1. Fetch available UTXOs for ctx.account
        // 2. Build script conditions based on proposal state (from Supabase/Indexer)
        // 3. Build and sign transaction using the builder
        
        const amount = parseUnits(input.amount, 8);
        console.log(`Building native Kaspa transaction for ${amount} sompi`);

        // This is where the UTXO abstraction shines:
        // const tx = await this.builder.buildEscrowLock(...)
        
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

    async verifyProposal(proposal: ProposalView): Promise<boolean> {
        console.log(`Verifying Kaspa L1 vProg for proposal ${proposal.id}`);
        
        const verifier = new VProgVerifier();
        return verifier.verifyEscrowAddress(proposal.recipient, {
            creator: proposal.creator,
            recipient: proposal.recipient,
            goal: BigInt(proposal.goal.value), // This is a simplification
            threshold: BigInt(proposal.minThreshold.value),
            deadline: Math.floor(proposal.deadline.getTime() / 1000),
        });
    }
}
