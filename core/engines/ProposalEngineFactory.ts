import { ProposalEngine } from "./types";
import { MockProposalEngine } from "./MockProposalEngine";

let mockEngine: MockProposalEngine | null = null;

export function getProposalEngine(): ProposalEngine {
    const engine = process.env.NEXT_PUBLIC_PROPOSAL_ENGINE ?? "mock";

    if (engine === "mock") {
        if (!mockEngine) {
            mockEngine = new MockProposalEngine();
        }

        return mockEngine;
    }

    throw new Error(`Unsupported proposal engine: ${engine}`);
}
