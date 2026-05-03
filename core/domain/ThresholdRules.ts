export const DEFAULT_KAS_DECIMALS = 8;

type BaseTier = 30 | 40 | 50 | 60;
type TimePenalty = 0 | 5 | 10;

/**
 * Calcula el porcentaje final sumando base, penalización y un margen técnico de seguridad.
 */
export function getRequiredFundingPercent(
  baseTier: BaseTier,
  timePenalty: TimePenalty
): number {
  const technicalSafetyMargin = 10;
  return baseTier + timePenalty + technicalSafetyMargin;
}

/**
 * Calculates the minimum threshold required for a proposal to be valid.
 * Sychronized with the user's requested explicit margin logic.
 */
export function calculateMinThreshold(
    goalAtomic: bigint,
    durationSeconds: number,
    decimals: number = DEFAULT_KAS_DECIMALS
): bigint {
    const oneUnit = 10n ** BigInt(decimals);
    
    // 1. Determinar BaseTier
    let baseTier: BaseTier = 30;
    if (goalAtomic < 1000n * oneUnit) {
        baseTier = 30;
    } else if (goalAtomic < 10000n * oneUnit) {
        baseTier = 40;
    } else if (goalAtomic < 50000n * oneUnit) {
        baseTier = 50;
    } else {
        baseTier = 60;
    }

    // 2. Determinar TimePenalty
    const daysCount = Math.floor(durationSeconds / 86400);
    let timePenalty: TimePenalty = 0;
    
    if (daysCount <= 3) {
        timePenalty = 0; // Eliminamos el negativo por seguridad
    } else if (daysCount <= 14) {
        timePenalty = 0;
    } else if (daysCount <= 30) {
        timePenalty = 5;
    } else {
        timePenalty = 10;
    }

    // 3. Calcular porcentaje final con la nueva función solicitada
    const finalPercentage = BigInt(getRequiredFundingPercent(baseTier, timePenalty));

    // 4. Calcular cantidad atómica final
    // (goalAtomic * finalPercentage) / 100
    return (goalAtomic * finalPercentage) / 100n;
}
