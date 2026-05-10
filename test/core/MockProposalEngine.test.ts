import { expect } from "chai";
import { MockProposalEngine } from "../../core/engines/MockProposalEngine";
import type { ProposalEngineContext, CreateProposalInput } from "../../core/engines/types";

describe("MockProposalEngine", function () {
    let engine: MockProposalEngine;
    let ctx: ProposalEngineContext;

    beforeEach(function () {
        engine = new MockProposalEngine();
        ctx = {
            chain: "mock",
            account: "0x1111111111111111111111111111111111111111",
        };
    });

    it("has kind 'mock'", function () {
        expect(engine.kind).to.equal("mock");
    });

    it("creates a proposal and returns it in the list", async function () {
        const input: CreateProposalInput = {
            recipient: "0x2222222222222222222222222222222222222222",
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            goal: "100",
            minThreshold: "50",
            durationSeconds: 3600,
            metadataURI: "local://test",
        };

        const result = await engine.createProposal(ctx, input);
        expect(result.txId).to.include("mock-create-");

        const proposals = await engine.listProposals();
        expect(proposals).to.have.length(1);
        expect(proposals[0].creator).to.equal(ctx.account);
        expect(proposals[0].recipient).to.equal(input.recipient);
        expect(proposals[0].goal.value).to.equal("100");
        expect(proposals[0].status).to.equal("active");
    });

    it("funds a proposal and increases totalRaised", async function () {
        await engine.createProposal(ctx, {
            recipient: "0x2222222222222222222222222222222222222222",
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            goal: "100",
            minThreshold: "50",
            durationSeconds: 3600,
            metadataURI: "local://test",
        });

        const proposals = await engine.listProposals();
        const id = proposals[0].id;

        await engine.fundProposal(ctx, {
            proposalId: id,
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            amount: "25",
        });

        const updated = await engine.getProposal(id);
        expect(Number(updated.totalRaised.value)).to.equal(25);
    });

    it("finalizes successfully when threshold is met", async function () {
        await engine.createProposal(ctx, {
            recipient: "0x2222222222222222222222222222222222222222",
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            goal: "100",
            minThreshold: "50",
            durationSeconds: 3600,
            metadataURI: "local://test",
        });

        const proposals = await engine.listProposals();
        const id = proposals[0].id;

        await engine.fundProposal(ctx, {
            proposalId: id,
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            amount: "60",
        });

        await engine.finalizeProposal(ctx, id);

        const finalized = await engine.getProposal(id);
        expect(finalized.status).to.equal("succeeded");
    });

    it("finalizes as failed when threshold is not met", async function () {
        await engine.createProposal(ctx, {
            recipient: "0x2222222222222222222222222222222222222222",
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            goal: "100",
            minThreshold: "50",
            durationSeconds: 3600,
            metadataURI: "local://test",
        });

        const proposals = await engine.listProposals();
        const id = proposals[0].id;

        await engine.fundProposal(ctx, {
            proposalId: id,
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            amount: "10",
        });

        await engine.finalizeProposal(ctx, id);

        const finalized = await engine.getProposal(id);
        expect(finalized.status).to.equal("failed");
        expect(finalized.canWithdraw).to.equal(true);
    });

    it("withdraw returns a valid tx result", async function () {
        const result = await engine.withdraw(ctx, 1);
        expect(result.txId).to.include("mock-withdraw-");
    });

    it("withdrawMany returns a valid tx result", async function () {
        const result = await engine.withdrawMany(ctx, [1, 2, 3]);
        expect(result.txId).to.include("mock-withdraw-many-");
    });

    it("throws when getting a non-existent proposal", async function () {
        try {
            await engine.getProposal(999);
            expect.fail("Should have thrown");
        } catch (e) {
            expect((e as Error).message).to.equal("Proposal not found");
        }
    });

    it("funds a non-existent proposal in hybrid mode (Supabase-only)", async function () {
        // In hybrid mode, proposals exist in Supabase but not in mock memory
        const result = await engine.fundProposal(ctx, {
            proposalId: 42,
            asset: { type: "native", symbol: "KAS", decimals: 8 },
            amount: "10",
        });

        expect(result.txId).to.equal("mock-fund-42");
    });

    it("finalizes a non-existent proposal in hybrid mode", async function () {
        const result = await engine.finalizeProposal(ctx, 42);
        expect(result.txId).to.equal("mock-finalize-42");
    });
});
