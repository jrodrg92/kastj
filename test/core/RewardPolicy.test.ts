import { expect } from "chai";
import { calculateRewards } from "../../core/domain/RewardPolicy";

describe("RewardPolicy", function () {
    it("splits 100 into 93 recipient / 5 creator / 2 platform", function () {
        const result = calculateRewards({
            totalRaised: 100n,
            creator: "0x1111111111111111111111111111111111111111",
            recipient: "0x2222222222222222222222222222222222222222",
        });

        expect(result.recipientAmount).to.equal(93n);
        expect(result.creatorReward).to.equal(5n);
        expect(result.platformFee).to.equal(2n);
    });

    it("does not pay creator reward if creator is recipient", function () {
        const same = "0x1111111111111111111111111111111111111111";

        const result = calculateRewards({
            totalRaised: 100n,
            creator: same,
            recipient: same,
        });

        expect(result.recipientAmount).to.equal(98n);
        expect(result.creatorReward).to.equal(0n);
        expect(result.platformFee).to.equal(2n);
    });

    it("rejects invalid reward policy", function () {
        expect(() =>
            calculateRewards({
                totalRaised: 100n,
                creator: "0x1111111111111111111111111111111111111111",
                recipient: "0x2222222222222222222222222222222222222222",
                creatorRewardBps: 9000n,
                platformFeeBps: 2000n,
            }),
        ).to.throw("Invalid reward policy");
    });
});
