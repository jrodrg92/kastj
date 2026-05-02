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

        this.proposals.unshift({
            id,
            creator: ctx.account,
            recipient: input.recipient,
            asset: input.asset,
            goal: {
                value: input.goal,
                decimals: 18,
                symbol: "KAS",
            },
            minThreshold: {
                value: input.minThreshold,
                decimals: 18,
                symbol: "KAS",
            },
            totalRaised: {
                value: "0",
                decimals: 18,
                symbol: "KAS",
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

        // In hybrid mode (mock engine + Supabase data), the proposal
        // may exist in DB but not in the mock's in-memory array.
        if (proposal) {
            proposal.totalRaised = {
                ...proposal.totalRaised,
                value: String(
                    Number(proposal.totalRaised.value) + Number(input.amount),
                ),
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
            const raised = Number(proposal.totalRaised.value);
            const threshold = Number(proposal.minThreshold.value);

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
}
