import { expect } from "chai";
import { KaspaL1ProposalEngine } from "../../core/engines/KaspaL1ProposalEngine";
import { VProgsProposalEngine } from "../../core/engines/VProgsProposalEngine";
import type { ProposalEngineContext } from "../../core/engines/types";

const ctx: ProposalEngineContext = {
    chain: "kaspa-l1",
    account: "kaspa:qr123",
};

const dummyInput = {
    recipient: "kaspa:qr456",
    asset: { type: "native" as const, symbol: "KAS", decimals: 8 },
    goal: "100",
    minThreshold: "50",
    durationSeconds: 3600,
    metadataURI: "local://test",
};

describe("KaspaL1ProposalEngine (stub)", function () {
    const engine = new KaspaL1ProposalEngine();

    it("has kind 'kaspa-l1'", function () {
        expect(engine.kind).to.equal("kaspa-l1");
    });

    it("throws on createProposal", async function () {
        try {
            await engine.createProposal(ctx, dummyInput);
            expect.fail("Should have thrown");
        } catch (e) {
            expect((e as Error).message).to.include("KaspaL1ProposalEngine");
        }
    });

    it("throws on all write methods", async function () {
        const methods = [
            () => engine.fundProposal(ctx, { proposalId: 1, asset: { type: "native", symbol: "KAS", decimals: 8 }, amount: "10" }),
            () => engine.finalizeProposal(ctx, 1),
            () => engine.withdraw(ctx, 1),
            () => engine.withdrawMany(ctx, [1, 2]),
        ];

        for (const fn of methods) {
            try {
                await fn();
                expect.fail("Should have thrown");
            } catch (e) {
                expect((e as Error).message).to.include("KaspaL1ProposalEngine");
            }
        }
    });
});

describe("VProgsProposalEngine (stub)", function () {
    const engine = new VProgsProposalEngine();

    it("has kind 'vprogs'", function () {
        expect(engine.kind).to.equal("vprogs");
    });

    it("throws on createProposal with vProgs-specific message", async function () {
        try {
            await engine.createProposal(
                { ...ctx, chain: "vprogs" },
                dummyInput,
            );
            expect.fail("Should have thrown");
        } catch (e) {
            expect((e as Error).message).to.include("vProgs SDK");
        }
    });
});
