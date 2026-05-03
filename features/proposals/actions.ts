"use server";

import { createProposalSchema } from "@/lib/validation";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Prepares and saves a pending proposal.
 */
export async function prepareProposalMetadata(input: z.infer<typeof createProposalSchema>, creatorAddress: string, txHash: string) {
  // 1. Validate on server
  const validated = createProposalSchema.safeParse(input);
  if (!validated.success) {
    const firstError = validated.error.errors[0];
    throw new Error(`${firstError.path.join(".")}: ${firstError.message}`);
  }

  // 2. Prepare metadata
  const metadata = {
    title: validated.data.title,
    description: validated.data.description,
    createdAt: new Date().toISOString(),
  };

  const metadataURI = `local://${encodeURIComponent(JSON.stringify(metadata))}`;
  const tempId = -Math.abs(Math.floor(Date.now() / 1000));

  // 3. Save to DB using Admin Client (Bypass RLS) ONLY if we have a txHash
  if (txHash) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("proposals").insert({
      id: tempId,
      creator: creatorAddress,
      recipient: validated.data.recipient,
      token: "0x0000000000000000000000000000000000000000", // Default
      goal: validated.data.goal,
      min_threshold: validated.data.minThreshold,
      deadline: Math.floor(Date.now() / 1000) + Number(validated.data.duration),
      status: "pending",
      title: validated.data.title,
      description: validated.data.description,
      metadata_uri: metadataURI,
      tx_hash: txHash,
      created_at: Math.floor(Date.now() / 1000)
    });

    if (error) {
      console.error("Error saving pending proposal:", error);
    }
  }

  return {
    tempId,
    metadataURI,
    ...validated.data,
    durationSeconds: Number(validated.data.duration),
  };
}
