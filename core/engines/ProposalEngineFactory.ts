import type { ProposalEngine } from "./types";
import { MockProposalEngine } from "./MockProposalEngine";
import { ZkEvmProposalEngine } from "./ZkEvmProposalEngine";

let mockEngine: MockProposalEngine | null = null;
let zkEvmEngine: ZkEvmProposalEngine | null = null;

export function getProposalEngine(): ProposalEngine {
    const engine = process.env.NEXT_PUBLIC_PROPOSAL_ENGINE ?? "mock";

    if (engine === "mock") {
        if (!mockEngine) {
            mockEngine = new MockProposalEngine();
        }
        return mockEngine;
    }

    if (engine === "kasplex-zkevm") {
        if (!zkEvmEngine) {
            zkEvmEngine = new ZkEvmProposalEngine();
        }
        return zkEvmEngine;
    }

    throw new Error(`Unsupported proposal engine: ${engine}`);
}
