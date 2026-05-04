import type { ProposalId, ProposalAsset } from "../../engines/proposal-engine.interface";
import type { DbProposal, DbFunding, DbActivity } from "../../types/supabase";

/**
 * Port for reading proposal data from any persistence layer.
 * The current implementation uses Supabase, but this could be
 * swapped for direct chain reads or a custom indexer API.
 */
export interface ProposalRepository {
    /** List all proposals, newest first. */
    listProposals(): Promise<DbProposal[]>;

    /** Get a single proposal by ID. Returns null if not found. */
    getProposalById(id: ProposalId): Promise<DbProposal | null>;

    /** Get all fundings for a proposal, newest first. */
    getFundings(proposalId: ProposalId): Promise<DbFunding[]>;

    /** Get all activity for a proposal, newest first. */
    getActivity(proposalId: ProposalId): Promise<DbActivity[]>;

    /** Get all proposal IDs that a given address has funded. */
    getSupportedProposalIds(address: string): Promise<number[]>;

    /** Get recent global activity, newest first. */
    getRecentActivity(limit?: number): Promise<DbActivity[]>;
}
