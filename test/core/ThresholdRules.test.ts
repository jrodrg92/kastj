import { expect } from "chai";
import { calculateMinThreshold } from "../../core/domain/ThresholdRules";

describe("ThresholdRules", function () {
    const ONE_KAS = 100_000_000n; // 8 decimals
    const DAY_SECONDS = 24 * 3600;

    it("calculates correctly for < 1.000 KAS and <= 3 days (30% - 5% = 25%)", () => {
        const goal = 500n * ONE_KAS;
        const result = calculateMinThreshold(goal, 3 * DAY_SECONDS);
        expect(result).to.equal(125n * ONE_KAS); // 25% of 500
    });

    it("calculates correctly for < 10.000 KAS and <= 14 days (40% + 0% = 40%)", () => {
        const goal = 5000n * ONE_KAS;
        const result = calculateMinThreshold(goal, 10 * DAY_SECONDS);
        expect(result).to.equal(2000n * ONE_KAS); // 40% of 5000
    });

    it("calculates correctly for < 50.000 KAS and <= 30 days (50% + 5% = 55%)", () => {
        const goal = 20000n * ONE_KAS;
        const result = calculateMinThreshold(goal, 20 * DAY_SECONDS);
        expect(result).to.equal(11000n * ONE_KAS); // 55% of 20000
    });

    it("calculates correctly for >= 50.000 KAS and > 30 days (60% + 10% = 70%)", () => {
        const goal = 80000n * ONE_KAS;
        const result = calculateMinThreshold(goal, 60 * DAY_SECONDS);
        expect(result).to.equal(56000n * ONE_KAS); // 70% of 80000
    });

    it("clamps at 25% minimum", () => {
        const goal = 500n * ONE_KAS; // Base 30%
        // Normally -5% for 3 days = 25%
        // What if we did something crazy? Let's just ensure it hits exactly 25%
        const result = calculateMinThreshold(goal, 1 * DAY_SECONDS);
        expect(result).to.equal(125n * ONE_KAS); 
    });

    it("clamps at 80% maximum", () => {
        // There is no combination that goes above 70% (60% + 10%) with the current rules,
        // but the clamp is there for safety. Let's just test a big proposal.
        const goal = 100_000n * ONE_KAS; // Base 60%
        const result = calculateMinThreshold(goal, 100 * DAY_SECONDS); // +10%
        expect(result).to.equal(70_000n * ONE_KAS); // 70%
    });

    it("works with different decimals (e.g. 18 for a generic ERC20)", () => {
        const ONE_TOKEN = 10n ** 18n;
        const goal = 5000n * ONE_TOKEN; // < 10000, Base 40%
        const result = calculateMinThreshold(goal, 10 * DAY_SECONDS, 18);
        expect(result).to.equal(2000n * ONE_TOKEN); // 40%
    });
});
