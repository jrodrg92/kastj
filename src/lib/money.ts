import { formatUnits, parseUnits } from "ethers";

/**
 * Premium utility for safe financial calculations using BigInt.
 * Wraps ethers utilities with a more domain-specific API for Kastj.
 */
export class Money {
  static fromRaw(raw: string | bigint, decimals: number = 18): string {
    return formatUnits(raw, decimals);
  }

  static toRaw(value: string, decimals: number = 18): bigint {
    try {
      return parseUnits(value, decimals);
    } catch {
      return 0n;
    }
  }

  static add(a: string | bigint, b: string | bigint, decimals: number = 18): string {
    const aRaw = typeof a === "string" ? this.toRaw(a, decimals) : a;
    const bRaw = typeof b === "string" ? this.toRaw(b, decimals) : b;
    return this.fromRaw(aRaw + bRaw, decimals);
  }

  static subtract(a: string | bigint, b: string | bigint, decimals: number = 18): string {
    const aRaw = typeof a === "string" ? this.toRaw(a, decimals) : a;
    const bRaw = typeof b === "string" ? this.toRaw(b, decimals) : b;
    return this.fromRaw(aRaw - bRaw, decimals);
  }

  static multiply(a: string | bigint, factor: number, decimals: number = 18): string {
    const aRaw = typeof a === "string" ? this.toRaw(a, decimals) : a;
    const factorRaw = BigInt(Math.floor(factor * 10000));
    return this.fromRaw((aRaw * factorRaw) / 10000n, decimals);
  }

  static percentage(part: string | bigint, total: string | bigint, decimals: number = 18): number {
    const partRaw = typeof part === "string" ? this.toRaw(part, decimals) : part;
    const totalRaw = typeof total === "string" ? this.toRaw(total, decimals) : total;
    if (totalRaw === 0n) return 0;
    return Number((partRaw * 10000n) / totalRaw) / 100;
  }
}
