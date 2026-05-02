import type {
    CreateProposalInput,
    FundProposalInput,
    ProposalId,
    TxResult,
} from "../engines/types";

/**
 * Port for submitting transactions to the blockchain.
 * Abstracts away the specific chain (zkEVM, Kaspa L1, vProgs)
 * so the application layer doesn't depend on chain specifics.
 */
export interface ChainAdapter {
    /** Submit a create-proposal transaction. */
    createProposal(
        signer: unknown,
        input: CreateProposalInput,
    ): Promise<TxResult>;

    /** Submit a fund-proposal transaction. */
    fundProposal(
        signer: unknown,
        input: FundProposalInput,
    ): Promise<TxResult>;

    /** Submit a finalize-proposal transaction. */
    finalizeProposal(
        signer: unknown,
        proposalId: ProposalId,
    ): Promise<TxResult>;

    /** Submit a withdrawal transaction. */
    withdraw(signer: unknown, proposalId: ProposalId): Promise<TxResult>;

    /** Submit a batch withdrawal transaction. */
    withdrawMany(
        signer: unknown,
        proposalIds: ProposalId[],
    ): Promise<TxResult>;
}
