"use server";

import { createProposalSchema } from "@/lib/validation";
import { z } from "zod";

/**
 * Prepares a proposal for creation.
 * Validates the input and returns the metadata URI.
 */
export async function prepareProposalMetadata(input: z.infer<typeof createProposalSchema>) {
  // 1. Validate on server
  const validated = createProposalSchema.safeParse(input);
  if (!validated.success) {
    throw new Error("Invalid proposal data: " + validated.error.message);
  }

  // 2. Prepare metadata URI
  // In the future, this could upload to IPFS or Supabase Storage here.
  // For now, we continue with the local:// scheme but generated on the server.
  const metadata = {
    title: validated.data.title,
    description: validated.data.description,
    createdAt: new Date().toISOString(),
  };

  const metadataURI = `local://${encodeURIComponent(JSON.stringify(metadata))}`;

  return {
    metadataURI,
    ...validated.data,
    durationSeconds: Number(validated.data.duration),
  };
}
