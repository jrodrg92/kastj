import {
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

        this.proposals.unshift({
            id,
            creator: ctx.account,
            recipient: input.recipient,
            title: input.title,
            description: input.description,
            asset: input.asset,
            goal: input.goal,
            minThreshold: input.minThreshold,
            totalRaised: {
                value: "0",
                decimals: input.asset.decimals,
                symbol: input.asset.symbol,
            },
            deadline: input.deadline,
            status: "active",
            canWithdraw: false,
            canFinalize: false,
        });

        return {
            txId: `mock-create-${id}`,
        };
    }

    async fundProposal(_ctx: ProposalEngineContext, input: FundProposalInput): Promise<TxResult> {
        const proposal = this.proposals.find((p) => p.id === input.proposalId);

        if (!proposal) {
            throw new Error("Proposal not found");
        }

        proposal.totalRaised = {
            ...proposal.totalRaised,
            value: String(Number(proposal.totalRaised.value) + Number(input.amount.value)),
        };

        return {
            txId: `mock-fund-${input.proposalId}`,
        };
    }

    async finalizeProposal(_ctx: ProposalEngineContext, proposalId: ProposalId): Promise<TxResult> {
        const proposal = this.proposals.find((p) => p.id === proposalId);

        if (!proposal) {
            throw new Error("Proposal not found");
        }

        const raised = Number(proposal.totalRaised.value);
        const threshold = Number(proposal.minThreshold.value);

        proposal.status = raised >= threshold ? "succeeded" : "failed";
        proposal.canFinalize = false;
        proposal.canWithdraw = proposal.status === "failed";

        return {
            txId: `mock-finalize-${proposalId}`,
        };
    }

    async withdraw(_ctx: ProposalEngineContext, proposalId: ProposalId): Promise<TxResult> {
        return {
            txId: `mock-withdraw-${proposalId}`,
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
}
