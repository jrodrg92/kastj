import { expect } from "chai";
import {
    canFinalizeProposal,
    canFundProposal,
    ProposalStatus,
    resolveProposalStatus,
} from "../../core/domain/ProposalStateMachine";

describe("ProposalStateMachine", function () {
    it("keeps proposal active before deadline", function () {
        const status = resolveProposalStatus({
            totalRaised: 10n,
            threshold: 100n,
            deadline: 1000,
            now: 999,
        });

        expect(status).to.equal(ProposalStatus.Active);
    });

    it("marks proposal successful after deadline if threshold reached", function () {
        const status = resolveProposalStatus({
            totalRaised: 100n,
            threshold: 100n,
            deadline: 1000,
            now: 1000,
        });

        expect(status).to.equal(ProposalStatus.Successful);
    });

    it("marks proposal failed after deadline if threshold not reached", function () {
        const status = resolveProposalStatus({
            totalRaised: 99n,
            threshold: 100n,
            deadline: 1000,
            now: 1000,
        });

        expect(status).to.equal(ProposalStatus.Failed);
    });

    it("allows funding only while active and before deadline", function () {
        expect(
            canFundProposal({
                status: ProposalStatus.Active,
                deadline: 1000,
                now: 999,
            }),
        ).to.equal(true);

        expect(
            canFundProposal({
                status: ProposalStatus.Active,
                deadline: 1000,
                now: 1000,
            }),
        ).to.equal(false);
    });

    it("allows finalize only after deadline while active", function () {
        expect(
            canFinalizeProposal({
                status: ProposalStatus.Active,
                deadline: 1000,
                now: 1000,
            }),
        ).to.equal(true);

        expect(
            canFinalizeProposal({
                status: ProposalStatus.Active,
                deadline: 1000,
                now: 999,
            }),
        ).to.equal(false);
    });
});
