export const BPS_DENOMINATOR = 10_000n;

export type RewardPolicyInput = {
    totalRaised: bigint;
    creator: string;
    recipient: string;
    creatorRewardBps?: bigint;
    platformFeeBps?: bigint;
};

export type RewardPolicyResult = {
    recipientAmount: bigint;
    creatorReward: bigint;
    platformFee: bigint;
};

export function calculateRewards({
    totalRaised,
    creator,
    recipient,
    creatorRewardBps = 500n,
    platformFeeBps = 200n,
}: RewardPolicyInput): RewardPolicyResult {
    if (totalRaised < 0n) {
        throw new Error("totalRaised cannot be negative");
    }

    if (creatorRewardBps + platformFeeBps > BPS_DENOMINATOR) {
        throw new Error("Invalid reward policy");
    }

    const sameCreatorAndRecipient = creator.toLowerCase() === recipient.toLowerCase();

    const creatorReward = sameCreatorAndRecipient
        ? 0n
        : (totalRaised * creatorRewardBps) / BPS_DENOMINATOR;

    const platformFee = (totalRaised * platformFeeBps) / BPS_DENOMINATOR;

    const recipientAmount = totalRaised - creatorReward - platformFee;

    return {
        recipientAmount,
        creatorReward,
        platformFee,
    };
}
