const vault = process.env.NEXT_PUBLIC_KASTJ_VAULT;
const treasury = process.env.NEXT_PUBLIC_KASTJ_TREASURY;
const manager = process.env.NEXT_PUBLIC_KASTJ_MANAGER;

if (!vault || !treasury || !manager) {
  throw new Error("Missing critical contract addresses in environment variables. Check .env.local");
}

export const CONTRACTS = {
  vault,
  treasury,
  manager,
} as const;