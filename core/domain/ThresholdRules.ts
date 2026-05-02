export const DEFAULT_KAS_DECIMALS = 8;

/**
 * Calculates the minimum threshold required for a proposal to be valid.
 * This is based on a pure mathematical formula using the goal amount and duration.
 * 
 * @param goalAtomic The goal amount in atomic units (e.g. Sompi for Kaspa)
 * @param durationSeconds The duration of the proposal in seconds
 * @param decimals The number of decimals for the asset (default 8)
 * @returns The minimum threshold amount in atomic units
 */
export function calculateMinThreshold(
    goalAtomic: bigint,
    durationSeconds: number,
    decimals: number = DEFAULT_KAS_DECIMALS
): bigint {
    const ONE_UNIT = 10n ** BigInt(decimals);
    
    // Calculate base percentage based on goal in whole units
    let basePercentage = 0n;
    if (goalAtomic < 1000n * ONE_UNIT) {
        basePercentage = 30n;
    } else if (goalAtomic < 10000n * ONE_UNIT) {
        basePercentage = 40n;
    } else if (goalAtomic < 50000n * ONE_UNIT) {
        basePercentage = 50n;
    } else {
        basePercentage = 60n;
    }

    // Calculate duration modifier
    const days = durationSeconds / (24 * 3600);
    let durationModifier = 0n;
    
    if (days <= 3) {
        durationModifier = -5n;
    } else if (days <= 14) {
        durationModifier = 0n;
    } else if (days <= 30) {
        durationModifier = 5n;
    } else {
        durationModifier = 10n;
    }

    // Apply modifier and clamp between 25% and 80%
    let finalPercentage = basePercentage + durationModifier;
    
    if (finalPercentage < 25n) {
        finalPercentage = 25n;
    } else if (finalPercentage > 80n) {
        finalPercentage = 80n;
    }

    // Calculate final atomic amount
    // (goalAtomic * finalPercentage) / 100
    return (goalAtomic * finalPercentage) / 100n;
}
