import { Contract, JsonRpcSigner, parseUnits, formatUnits, ZeroAddress } from "ethers";
import { CONTRACTS } from "@/lib/contracts";
import ProposalManagerAbi from "@/abis/ProposalManager.json";
import EscrowVaultAbi from "@/abis/EscrowVault.json";
import type {
    CreateProposalInput,
    FundProposalInput,
    ProposalEngine,
    ProposalEngineContext,
    ProposalCommand,
    VerificationResult,
    TxResult,
} from "./proposal-engine.interface";
import type { ProposalId, ProposalView } from "@/core/proposal/proposal.types";

const KRC20_APPROVE_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
];

export class ZkEvmProposalEngine implements ProposalEngine {
    readonly kind = "kasplex-zkevm" as const;

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
                throw new Error(`ZkEvmEngine: unknown command type`);
        }
    }

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
            parseUnits(input.goal, input.asset.decimals),
            parseUnits(input.minThreshold, input.asset.decimals),
            input.durationSeconds,
            0,      // SettlementMode.DeadlineOnly
            input.allowOverfunding ?? false,
            input.metadataURI,
        );

        return { txId: tx.hash };
    }

    async fundProposal(
        ctx: ProposalEngineContext,
        input: FundProposalInput,
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const manager = this.getManager(signer);
        const amount = parseUnits(input.amount, input.asset.decimals);

        if (input.asset.type === "native") {
            const tx = await manager.fundNative(input.proposalId, {
                value: amount,
            });
            return { txId: tx.hash };
        }

        const token = new Contract(
            input.asset.tokenAddress,
            KRC20_APPROVE_ABI,
            signer,
        );

        ctx.onProgress?.({ state: "approving" });
        const approveTx = await token.approve(CONTRACTS.vault, amount);
        
        ctx.onProgress?.({ state: "approving", txHash: approveTx.hash });
        // We wait for approval because the next tx depends on it, 
        // but the main action (funding) will return immediately.
        await approveTx.wait();

        ctx.onProgress?.({ state: "processing" });
        const fundTx = await manager.fundKrc20(input.proposalId, amount);
        return { txId: fundTx.hash };
    }

    async finalizeProposal(
        ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const manager = this.getManager(signer);
        const tx = await manager.finalizeProposal(proposalId);
        return { txId: tx.hash };
    }

    async withdraw(
        ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const vault = this.getVault(signer);
        const tx = await vault.withdraw(proposalId);
        return { txId: tx.hash };
    }

    async withdrawMany(
        ctx: ProposalEngineContext,
        proposalIds: ProposalId[],
    ): Promise<TxResult> {
        const signer = this.getSigner(ctx);
        const vault = this.getVault(signer);
        const tx = await vault.withdrawMany(proposalIds);
        return { txId: tx.hash };
    }

    // Read methods — app reads from Supabase, not from chain directly.
    // These exist to satisfy the interface for testing/future use.

    async getProposal(proposalId: ProposalId, provider?: unknown): Promise<ProposalView> {
        if (!provider) {
            throw new Error("ZkEVM engine: provider required for on-chain read");
        }

        const manager = new Contract(CONTRACTS.manager, ProposalManagerAbi, provider as any);
        const p = await manager.proposals(proposalId);

        if (p.creator === ZeroAddress) {
            throw new Error("Proposal not found on-chain");
        }

        // We assume 18 decimals for IKAS on L2 if it's the native asset
        const decimals = 18; 

        return {
            id: Number(proposalId),
            creator: p.creator,
            recipient: p.recipient,
            asset: p.token === ZeroAddress 
                ? { type: "native", symbol: "KAS", decimals }
                : { type: "krc20", tokenAddress: p.token as `0x${string}`, symbol: "UNKNOWN", decimals },
            goal: {
                value: formatUnits(p.goalAmount, decimals),
                raw: BigInt(p.goalAmount).toString(),
                symbol: "KAS",
                decimals
            },
            minThreshold: {
                value: formatUnits(p.minThreshold, decimals),
                raw: BigInt(p.minThreshold).toString(),
                symbol: "KAS",
                decimals
            },
            totalRaised: {
                value: formatUnits(p.raisedAmount, decimals),
                raw: BigInt(p.raisedAmount).toString(),
                symbol: "KAS",
                decimals
            },
            deadline: Number(p.deadline) * 1000,
            status: Number(p.status) === 0 ? "active" : Number(p.status) === 1 ? "succeeded" : "failed",
            metadataURI: p.metadataURI,
            canFinalize: false,
            canWithdraw: false
        };
    }

    async listProposals(): Promise<ProposalView[]> {
        throw new Error(
            "ZkEVM engine: use Supabase queries for listing proposals",
        );
    }

    /**
     * Real integrity check: compares local (Supabase) state with on-chain truth.
     * Returns a detailed result with the specific checks performed.
     */
    async verifyProposal(proposal: ProposalView, provider?: unknown): Promise<VerificationResult> {
        const timestamp = Date.now();
        try {
            const onChain = await this.getProposal(proposal.id, provider);
            
            const checks: string[] = [];
            
            // 1. Goal Integrity
            if (BigInt(onChain.goal.raw) === BigInt(proposal.goal.raw)) {
                checks.push("Goal amount matches on-chain state");
            } else {
                return { status: "failed", reason: `Goal mismatch: local=${proposal.goal.value}, on-chain=${onChain.goal.value}`, timestamp };
            }

            // 2. Raised Integrity
            if (BigInt(onChain.totalRaised.raw) === BigInt(proposal.totalRaised.raw)) {
                checks.push("Total raised matches on-chain state");
            } else {
                return { status: "failed", reason: `Raised amount mismatch: local=${proposal.totalRaised.value}, on-chain=${onChain.totalRaised.value}`, timestamp };
            }

            // 3. Status Integrity
            if (onChain.status === proposal.status) {
                checks.push(`Status matches on-chain state (${onChain.status})`);
            } else {
                return { status: "failed", reason: `Status mismatch: local=${proposal.status}, on-chain=${onChain.status}`, timestamp };
            }

            // 4. Recipient Integrity
            if (onChain.recipient.toLowerCase() === proposal.recipient.toLowerCase()) {
                checks.push("Recipient address matches on-chain state");
            } else {
                return { status: "failed", reason: "Recipient address mismatch", timestamp };
            }

            return { 
                status: "verified", 
                checks,
                timestamp 
            };
        } catch (e: unknown) {
            console.error("Verification failed:", e);
            const msg = e instanceof Error ? e.message : String(e);
            return { status: "failed", reason: `On-chain query failed: ${msg}`, timestamp };
        }
    }
}
