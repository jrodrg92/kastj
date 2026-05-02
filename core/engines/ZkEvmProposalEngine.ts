import { Contract, JsonRpcSigner, parseEther, ZeroAddress } from "ethers";
import { CONTRACTS } from "../../lib/contracts";
import ProposalManagerAbi from "../../abis/ProposalManager.json";
import EscrowVaultAbi from "../../abis/EscrowVault.json";
import type {
    CreateProposalInput,
    FundProposalInput,
    ProposalEngine,
    ProposalEngineContext,
    ProposalId,
    ProposalView,
    TxResult,
} from "./types";

const KRC20_APPROVE_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
];

export class ZkEvmProposalEngine implements ProposalEngine {
    readonly kind = "kasplex-zkevm" as const;

    private getManager(signer: JsonRpcSigner) {
        return new Contract(CONTRACTS.manager, ProposalManagerAbi, signer);
    }

    private getVault(signer: JsonRpcSigner) {
        return new Contract(CONTRACTS.vault, EscrowVaultAbi, signer);
    }

    private getSigner(ctx: ProposalEngineContext): JsonRpcSigner {
        if (!ctx.signer) {
            throw new Error("Signer required for ZkEVM operations");
        }
        return ctx.signer as JsonRpcSigner;
    }

    async createProposal(
        ctx: ProposalEngineContext,
        input: CreateProposalInput,
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const manager = this.getManager(signer);

        const token =
            input.asset.type === "native"
                ? ZeroAddress
                : input.asset.tokenAddress;

        const tx = await manager.createProposal(
            input.recipient,
            token,
            parseEther(input.goal),
            parseEther(input.minThreshold),
            input.durationSeconds,
            input.metadataURI,
        );

        const receipt = await tx.wait();
        return { txId: receipt.hash };
    }

    async fundProposal(
        ctx: ProposalEngineContext,
        input: FundProposalInput,
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const manager = this.getManager(signer);
        const amount = parseEther(input.amount);

        if (input.asset.type === "native") {
            const tx = await manager.fundNative(input.proposalId, {
                value: amount,
            });
            const receipt = await tx.wait();
            return { txId: receipt.hash };
        }

        const token = new Contract(
            input.asset.tokenAddress,
            KRC20_APPROVE_ABI,
            signer,
        );

        const approveTx = await token.approve(CONTRACTS.vault, amount);
        await approveTx.wait();

        const fundTx = await manager.fundKrc20(input.proposalId, amount);
        const receipt = await fundTx.wait();
        return { txId: receipt.hash };
    }

    async finalizeProposal(
        ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const manager = this.getManager(signer);
        const tx = await manager.finalizeProposal(proposalId);
        const receipt = await tx.wait();
        return { txId: receipt.hash };
    }

    async withdraw(
        ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const vault = this.getVault(signer);
        const tx = await vault.withdraw(proposalId);
        const receipt = await tx.wait();
        return { txId: receipt.hash };
    }

    async withdrawMany(
        ctx: ProposalEngineContext,
        proposalIds: ProposalId[],
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const vault = this.getVault(signer);
        const tx = await vault.withdrawMany(proposalIds);
        const receipt = await tx.wait();
        return { txId: receipt.hash };
    }

    // Read methods — app reads from Supabase, not from chain directly.
    // These exist to satisfy the interface for testing/future use.

    async getProposal(_proposalId: ProposalId): Promise<ProposalView> {
        throw new Error(
            "ZkEVM engine: use Supabase queries for reading proposals",
        );
    }

    async listProposals(): Promise<ProposalView[]> {
        throw new Error(
            "ZkEVM engine: use Supabase queries for listing proposals",
        );
    }
}
