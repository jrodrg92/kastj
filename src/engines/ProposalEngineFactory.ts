import type { ProposalEngine } from "./proposal-engine.interface";
import { MockProposalEngine } from "./MockProposalEngine";
import { ZkEvmProposalEngine } from "./ZkEvmProposalEngine";
import { KaspaL1ProposalEngine } from "./KaspaL1ProposalEngine";
import { VProgsProposalEngine } from "./VProgsProposalEngine";

let mockEngine: MockProposalEngine | null = null;
let zkEvmEngine: ZkEvmProposalEngine | null = null;
let kaspaL1Engine: KaspaL1ProposalEngine | null = null;
let vprogsEngine: VProgsProposalEngine | null = null;

/**
 * Factory for creating ProposalEngine instances.
 *
 * Controlled by NEXT_PUBLIC_PROPOSAL_ENGINE env var:
 * - "mock"           → In-memory mock for development
 * - "kasplex-zkevm"  → Kasplex zkEVM contracts (current production)
 * - "kaspa-l1"       → Native Kaspa L1 (stub, future)
 * - "vprogs"         → Kaspa vProgs smart contracts (stub, future)
 */
export function getProposalEngine(): ProposalEngine {
    const engine = process.env.NEXT_PUBLIC_PROPOSAL_ENGINE ?? "mock";

    switch (engine) {
        case "mock":
            if (!mockEngine) mockEngine = new MockProposalEngine();
            return mockEngine;

        case "kasplex-zkevm":
            if (!zkEvmEngine) zkEvmEngine = new ZkEvmProposalEngine();
            return zkEvmEngine;

        case "kaspa-l1":
            if (!kaspaL1Engine) kaspaL1Engine = new KaspaL1ProposalEngine();
            return kaspaL1Engine;

        case "vprogs":
            if (!vprogsEngine) vprogsEngine = new VProgsProposalEngine();
            return vprogsEngine;

        default:
            throw new Error(
                `Unsupported proposal engine: "${engine}". ` +
                    `Valid options: mock, kasplex-zkevm, kaspa-l1, vprogs`,
            );
    }
}
