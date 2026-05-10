/**
 * Unificación de reglas de negocio para propuestas.
 * Define cuándo una propuesta puede ser finalizada, financiada o retirada.
 */

export type SettlementMode = "deadline-only" | "early-if-goal-reached";

export interface ProposalRulesInput {
  status: "active" | "succeeded" | "failed";
  totalRaised: bigint;
  goalAmount: bigint;
  minThreshold: bigint;
  deadlineMs: number;
  nowMs: number;
  settlementMode: SettlementMode;
}

/**
 * Indica si una propuesta puede ser finalizada basándose en el tiempo y la recaudación.
 */
export function canFinalizeProposal(input: ProposalRulesInput): boolean {
  if (input.status !== "active") return false;

  const expired = input.nowMs >= input.deadlineMs;
  const reachedGoal = input.totalRaised >= input.goalAmount;

  // Si el modo es solo por plazo, esperamos al deadline.
  if (input.settlementMode === "deadline-only") {
    return expired;
  }

  // Si no, puede finalizar si expira O si llega a la meta.
  return expired || reachedGoal;
}

/**
 * Indica si se ha alcanzado el umbral mínimo de seguridad.
 */
export function hasReachedThreshold(input: ProposalRulesInput): boolean {
  return input.totalRaised >= input.minThreshold;
}

/**
 * Indica si la propuesta ha expirado temporalmente.
 */
export function isExpired(input: { deadlineMs: number; nowMs: number }): boolean {
  return input.nowMs >= input.deadlineMs;
}

/**
 * Indica si un usuario puede retirar sus fondos.
 */
export function canWithdrawFromProposal(input: { status: string }): boolean {
  return input.status === "failed";
}

/**
 * Determina el estado final (Éxito o Fracaso) tras la liquidación.
 */
export function determineFinalStatus(input: { totalRaised: bigint; minThreshold: bigint }): "succeeded" | "failed" {
  return input.totalRaised >= input.minThreshold ? "succeeded" : "failed";
}
