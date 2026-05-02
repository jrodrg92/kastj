# Kastj

**Conditional crowdfunding for community proposals on Kaspa.**

Kastj lets communities create proposals, lock funds in escrow, and automatically distribute them when goals are met — or enable safe withdrawals if they're not.

## How It Works

1. **Create a proposal** — Define title, description, goal, recipient wallet, and deadline.
2. **Community funds it** — Supporters lock funds in escrow until the deadline expires.
3. **Automatic settlement** — Success: 93% recipient · 5% creator reward · 2% treasury. Failure: supporters withdraw individually.

## Architecture

```
core/
├── domain/         Pure business logic (state machine, reward policy, rules)
├── engines/        ProposalEngine abstraction (Mock, ZkEVM, future vProgs)
├── ports/          Interfaces for external dependencies (repo, chain, metadata)
features/
├── proposals/      TanStack Query hooks for CRUD mutations
app/
├── page.tsx        Main proposals page
├── proposal/[id]/  Proposal detail page with real-time updates
components/         Reusable UI components (proposal, dashboard, wallet, etc.)
hooks/              Shared hooks (wallet, engine, user dashboard, activity)
contracts/          Solidity smart contracts (ProposalManager, EscrowVault)
indexer/            Node.js indexer syncing chain events to Supabase
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Data | TanStack Query v5, Supabase (Realtime + Postgres) |
| Chain | Ethers v6, Solidity 0.8.28 (Hardhat 3) |
| i18n | Custom EN/ES with context provider |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start dev server
npm run dev
```

### Environment Variables

See [`.env.example`](.env.example) for the frontend and [`indexer/.env.example`](indexer/.env.example) for the indexer.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `NEXT_PUBLIC_PROPOSAL_ENGINE` | `mock` or `kasplex-zkevm` |

## Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Contracts

- **ProposalManager.sol** — Creates proposals, handles funding, triggers finalization.
- **EscrowVault.sol** — Holds funds in escrow, distributes on success (93/5/2), enables withdrawals on failure.
- **KastjTreasury.sol** — Receives the 2% platform fee.

## ProposalEngine Abstraction

The `ProposalEngine` interface decouples the UI from the blockchain:

```typescript
interface ProposalEngine {
  createProposal(ctx, input): Promise<TxResult>;
  fundProposal(ctx, input): Promise<TxResult>;
  finalizeProposal(ctx, proposalId): Promise<TxResult>;
  withdraw(ctx, proposalId): Promise<TxResult>;
  withdrawMany(ctx, proposalIds): Promise<TxResult>;
}
```

Implementations:
- `MockProposalEngine` — In-memory for development/testing.
- `ZkEvmProposalEngine` — Connects to deployed Solidity contracts via ethers.js.
- `VProgsProposalEngine` — (Future) Native Kaspa L1 smart contracts.

Switch via `NEXT_PUBLIC_PROPOSAL_ENGINE` environment variable.

## License

MIT
