"use client";

import { useMemo } from "react";
import { useUi } from "@/contexts/UiContext";
import { parseMetadataUri, type ProposalMetadata } from "@/lib/proposalUtils";

/**
 * Hook to consume proposal metadata with integrated localization fallbacks.
 */
export function useProposalMetadata(uri: string | undefined | null): ProposalMetadata {
  const { t } = useUi();

  return useMemo(() => {
    const parsed = parseMetadataUri(uri);
    
    if (!parsed) {
      return {
        title: t.noTitle || "Untitled Proposal",
        description: t.noDescription || "No description available.",
      };
    }

    return {
      title: parsed.title || t.noTitle || "Untitled Proposal",
      summary: parsed.summary || "",
      description: parsed.description || t.noDescription || "No description available.",
      image: parsed.image || parsed.coverImage,
      coverImage: parsed.coverImage || parsed.image,
    };
  }, [uri, t]);
}
