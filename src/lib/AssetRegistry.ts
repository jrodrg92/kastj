/**
 * AssetRegistry: The single source of truth for asset configuration across Kastj.
 * Centralizes decimal precision and symbols to avoid version drift and hardcoding.
 */

export interface AssetConfig {
  symbol: string;
  decimals: number;
  name: string;
  isNative: boolean;
  address?: `0x${string}`;
}

export const ASSET_REGISTRY: Record<string, AssetConfig> = {
  KAS_ZK_EVM: {
    symbol: "KAS",
    decimals: 18,
    name: "Kaspa (zkEVM)",
    isNative: true,
  },
  KAS_L1: {
    symbol: "KAS",
    decimals: 8,
    name: "Kaspa (Native L1)",
    isNative: true,
  },
  IKAS: {
    symbol: "iKAS",
    decimals: 18,
    name: "iKAS (zkEVM Native)",
    isNative: true,
  },
  // Default decimals for KRC20 tokens if not specified
  DEFAULT_KRC20: {
    symbol: "TOKEN",
    decimals: 18,
    name: "Standard KRC20 Token",
    isNative: false,
  }
};

export function getAssetConfig(symbol: string, chain: string): AssetConfig {
  if (chain === "kasplex-zkevm") {
    if (symbol === "KAS" || symbol === "iKAS") return ASSET_REGISTRY.KAS_ZK_EVM;
  }
  if (chain === "kaspa-l1") {
    if (symbol === "KAS") return ASSET_REGISTRY.KAS_L1;
  }
  
  return ASSET_REGISTRY.DEFAULT_KRC20;
}

/**
 * Standardizes decimal normalization.
 * Always scales to 18 decimals for internal platform math.
 */
export function normalizeTo18(amount: bigint, fromDecimals: number): bigint {
  if (fromDecimals === 18) return amount;
  if (fromDecimals < 18) return amount * (10n ** BigInt(18 - fromDecimals));
  return amount / (10n ** BigInt(fromDecimals - 18));
}

export function denormalizeFrom18(amount: bigint, toDecimals: number): bigint {
  if (toDecimals === 18) return amount;
  if (toDecimals < 18) return amount / (10n ** BigInt(18 - toDecimals));
  return amount * (10n ** BigInt(toDecimals - 18));
}
