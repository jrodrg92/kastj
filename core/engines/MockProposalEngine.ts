import { parseUnits, formatUnits } from "../../lib/currencyUtils";
import type {
    CreateProposalInput,
    FundProposalInput,
    ProposalEngine,
    ProposalEngineContext,
    ProposalId,
    ProposalView,
    TxResult,
} from "./types";

export class MockProposalEngine implements ProposalEngine {
    readonly kind = "mock" as const;

    private proposals: ProposalView[] = [];

    async createProposal(
        ctx: ProposalEngineContext,
        input: CreateProposalInput,
    ): Promise<TxResult> {
        const id = this.proposals.length + 1;
        const decimals = input.asset.decimals ?? 18;
        const symbol = input.asset.symbol || (input.asset.type === "native" ? "KAS" : "TOKEN");

        this.proposals.unshift({
            id,
            creator: ctx.account,
            recipient: input.recipient,
            asset: input.asset,
            goal: {
                value: input.goal,
                raw: parseUnits(input.goal, decimals).toString(),
                decimals,
                symbol,
            },
            minThreshold: {
                value: input.minThreshold,
                raw: parseUnits(input.minThreshold, decimals).toString(),
                decimals,
                symbol,
            },
            totalRaised: {
                value: "0",
                raw: "0",
                decimals,
                symbol,
            },
            deadline: new Date(
                Date.now() + input.durationSeconds * 1000,
            ),
            status: "active",
            metadataURI: input.metadataURI,
            canWithdraw: false,
            canFinalize: false,
        });

        return { txId: `mock-create-${id}` };
    }

    async fundProposal(
        _ctx: ProposalEngineContext,
        input: FundProposalInput,
    ): Promise<TxResult> {
        const proposal = this.proposals.find(
            (p) => p.id === input.proposalId,
        );

        if (proposal) {
            const rawAmount = parseUnits(input.amount, proposal.totalRaised.decimals);
            const currentRaw = BigInt(proposal.totalRaised.raw);
            const newRaw = currentRaw + rawAmount;

            proposal.totalRaised = {
                ...proposal.totalRaised,
                raw: newRaw.toString(),
                value: formatUnits(newRaw, proposal.totalRaised.decimals),
            };
        }

        return { txId: `mock-fund-${input.proposalId}` };
    }

    async finalizeProposal(
        _ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult> {
        const proposal = this.proposals.find((p) => p.id === proposalId);

        if (proposal) {
            const raised = BigInt(proposal.totalRaised.raw);
            const threshold = BigInt(proposal.minThreshold.raw);

            proposal.status = raised >= threshold ? "succeeded" : "failed";
            proposal.canFinalize = false;
            proposal.canWithdraw = proposal.status === "failed";
        }

        return { txId: `mock-finalize-${proposalId}` };
    }

    async withdraw(
        _ctx: ProposalEngineContext,
        proposalId: ProposalId,
    ): Promise<TxResult> {
        return { txId: `mock-withdraw-${proposalId}` };
    }

    async withdrawMany(
        _ctx: ProposalEngineContext,
        proposalIds: ProposalId[],
    ): Promise<TxResult> {
        return {
            txId: `mock-withdraw-many-${proposalIds.join(",")}`,
        };
    }

    async getProposal(proposalId: ProposalId): Promise<ProposalView> {
        const proposal = this.proposals.find((p) => p.id === proposalId);

        if (!proposal) {
            throw new Error("Proposal not found");
        }

        return proposal;
    }

    async listProposals(): Promise<ProposalView[]> {
        return this.proposals;
    }

    async verifyProposal(_proposal: ProposalView): Promise<boolean> {
        return true;
    }
}
