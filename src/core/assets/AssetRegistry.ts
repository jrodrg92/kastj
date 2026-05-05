import type { ChainKind, ProposalAsset } from "../proposal/proposal.types";

export type AssetInfo = ProposalAsset & {
  id: string;
  chainKind: ChainKind;
  native: boolean;
};

const ASSETS: AssetInfo[] = [
  {
    id: "kaspa-l1-native",
    type: "native",
    symbol: "KAS",
    decimals: 8,
    chainKind: "kaspa-l1",
    native: true,
  },
  {
    id: "kasplex-zkevm-native",
    type: "native",
    symbol: "KAS",
    decimals: 18,
    chainKind: "kasplex-zkevm",
    native: true,
  },
  {
    id: "vprogs-native",
    type: "native",
    symbol: "KAS",
    decimals: 8, // Assuming 8 for vProgs as well, but can be adjusted
    chainKind: "vprogs",
    native: true,
  },
  {
    id: "mock-native",
    type: "native",
    symbol: "KAS",
    decimals: 18,
    chainKind: "mock",
    native: true,
  }
];

export class AssetRegistry {
  static getAssetsByChain(chain: ChainKind): AssetInfo[] {
    return ASSETS.filter((a) => a.chainKind === chain);
  }

  static getNativeAsset(chain: ChainKind): AssetInfo {
    const asset = ASSETS.find((a) => a.chainKind === chain && a.native);
    if (!asset) throw new Error(`No native asset found for chain ${chain}`);
    return asset;
  }

  static getAssetById(id: string): AssetInfo {
    const asset = ASSETS.find((a) => a.id === id);
    if (!asset) throw new Error(`Asset ${id} not found`);
    return asset;
  }
}
