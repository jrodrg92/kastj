/**
 * Port for storing and retrieving proposal metadata (title, description, images).
 * The current implementation uses inline local:// URIs, but this should be
 * migrated to IPFS or a dedicated storage service for production.
 */
export interface MetadataStorage {
    /** Store metadata and return a URI that can be used to retrieve it. */
    store(metadata: ProposalMetadata): Promise<string>;

    /** Retrieve metadata from a URI. Returns null if not found/parseable. */
    resolve(uri: string): Promise<ProposalMetadata | null>;
}

export interface ProposalMetadata {
    title: string;
    description: string;
    imageUrl?: string;
    externalUrl?: string;
}
