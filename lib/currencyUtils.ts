/**
 * Utilities for currency formatting and parsing without depending on ethers.
 * Supports both Kaspa (8 decimals) and EVM (18 decimals).
 */

export const DECIMALS = {
  KAS: 18, // 18 decimals on Kasplex ZK-EVM (EVM Standard)
  KAS_L1: 8, // 8 decimals on Kaspa L1
  ETH: 18,
  USDT: 6,
};

/**
 * Parses a human-readable decimal string to a BigInt representation.
 * Handles decimals correctly based on the provided decimal count.
 * Example: parseUnits("1.5", 8) -> 150,000,000n
 */
export function parseUnits(value: string, decimals: number): bigint {
  if (!value) return 0n;
  
  // Clean string and handle negative sign
  const cleanValue = value.trim();
  if (cleanValue === "" || cleanValue === ".") return 0n;

  const isNegative = cleanValue.startsWith("-");
  const absoluteValue = isNegative ? cleanValue.slice(1) : cleanValue;

  const [integer, fraction = ""] = absoluteValue.split(".");
  const normalizedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  
  const result = BigInt(integer + normalizedFraction);
  return isNegative ? -result : result;
}

/**
 * Formats a BigInt representation to a human-readable decimal string.
 * Example: formatUnits(150000000n, 8) -> "1.5"
 */
export function formatUnits(value: bigint | string | number, decimals: number): string {
  const bigValue = BigInt(value);
  const isNegative = bigValue < 0n;
  const absoluteValue = isNegative ? -bigValue : bigValue;
  
  const s = absoluteValue.toString().padStart(decimals + 1, "0");
  const pos = s.length - decimals;
  let result = `${s.slice(0, pos)}.${s.slice(pos)}`.replace(/\.?0+$/, "");
  
  if (result.endsWith(".")) result = result.slice(0, -1);
  if (result === ".0" || result === "0") result = "0";
  
  return isNegative && result !== "0" ? `-${result}` : result;
}

/** Specific helpers */
export function parseKAS(value: string): bigint {
  return parseUnits(value, DECIMALS.KAS);
}

export function formatKAS(value: bigint | string | number): string {
  return formatUnits(value, DECIMALS.KAS);
}

// NOTE: formatEther/parseEther removed to prevent accidental usage with wrong decimals.
// Use parseUnits(val, 18) for ETH or explicit decimals for other tokens.
