/**
 * Utilities for currency formatting and parsing without depending on ethers.
 * Supports both Kaspa (8 decimals) and EVM (18 decimals).
 */

export const DECIMALS = {
  KAS: 8,
  ETH: 18,
  USDT: 6,
};

/**
 * Parses a human-readable decimal string to a BigInt representation.
 * Example: parseUnits("1.5", 8) -> 150,000,000n
 */
export function parseUnits(value: string, decimals: number): bigint {
  if (!value || isNaN(Number(value))) return 0n;
  
  const [integer, fraction = ""] = value.split(".");
  const normalizedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  
  return BigInt(integer + normalizedFraction);
}

/**
 * Formats a BigInt representation to a human-readable decimal string.
 * Example: formatUnits(150000000n, 8) -> "1.5"
 */
export function formatUnits(value: bigint | string | number, decimals: number): string {
  const bigValue = BigInt(value);
  const s = bigValue.toString().padStart(decimals + 1, "0");
  const pos = s.length - decimals;
  const result = `${s.slice(0, pos)}.${s.slice(pos)}`.replace(/\.?0+$/, "");
  return result.endsWith(".") ? result.slice(0, -1) : result;
}

/** Legacy-style helpers for quick replacement */
export function parseKAS(value: string): bigint {
  return parseUnits(value, DECIMALS.KAS);
}

export function formatKAS(value: bigint | string | number): string {
  return formatUnits(value, DECIMALS.KAS);
}

export function parseEther(value: string): bigint {
  return parseUnits(value, DECIMALS.ETH);
}

export function formatEther(value: bigint | string | number): string {
  return formatUnits(value, DECIMALS.ETH);
}
