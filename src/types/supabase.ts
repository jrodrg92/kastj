// Types matching the Supabase schema used by the frontend

export interface DbProposal {
    id: number;
    creator: string;
    recipient: string;
    token: string | null;
    goal: string;
    min_threshold: string;
    deadline: number;
    total_raised: string;
    status: string;
    success: boolean | null;
    metadata_uri: string | null;
    title: string | null;
    description: string | null;
    created_at: number | null;
}

export interface DbFunding {
    id: number;
    proposal_id: number;
    supporter: string;
    token: string | null;
    amount: string;
    tx_hash: string | null;
    created_at: number | null;
}

export interface DbActivity {
    id: number;
    type: "created" | "funded" | "succeeded" | "failed";
    proposal_id: number;
    actor: string | null;
    amount: string | null;
    message: string;
    created_at: number | null;
}

export interface DbProposalMetadata {
    proposal_id: number;
    title: string | null;
    description: string | null;
    created_at: number | null;
}
