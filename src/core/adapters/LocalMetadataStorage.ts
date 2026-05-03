import type { MetadataStorage, ProposalMetadata } from "../ports/MetadataStorage";

/**
 * LocalMetadataStorage encodes metadata inline as `local://` URIs.
 *
 * This is the current implementation used by Kastj. It stores metadata
 * directly in the URI as URL-encoded JSON, which is simple but doesn't
 * scale for large metadata (images, rich content).
 *
 * For production, replace with IpfsMetadataStorage or SupabaseMetadataStorage.
 */
export class LocalMetadataStorage implements MetadataStorage {
    async store(metadata: ProposalMetadata): Promise<string> {
        const payload = JSON.stringify({
            title: metadata.title,
            description: metadata.description,
            ...(metadata.imageUrl && { imageUrl: metadata.imageUrl }),
            ...(metadata.externalUrl && {
                externalUrl: metadata.externalUrl,
            }),
        });

        return `local://${encodeURIComponent(payload)}`;
    }

    async resolve(uri: string): Promise<ProposalMetadata | null> {
        if (!uri.startsWith("local://") && !uri.startsWith("supabase://")) {
            return null;
        }

        try {
            const raw = uri
                .replace("local://", "")
                .replace("supabase://", "");
            const parsed = JSON.parse(decodeURIComponent(raw));

            return {
                title: parsed.title ?? "Untitled proposal",
                description:
                    parsed.description ?? "No description available.",
                imageUrl: parsed.imageUrl,
                externalUrl: parsed.externalUrl,
            };
        } catch {
            return null;
        }
    }
}
