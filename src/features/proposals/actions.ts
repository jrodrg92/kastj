"use server";

import { createProposalSchema } from "@/lib/validation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { parseUnits } from "@/lib/currencyUtils";

/**
 * Prepares and saves a pending proposal.
 * Scaling to 18 decimals for ZK-EVM consistency in DB.
 */
export async function prepareProposalMetadata(
  input: z.infer<typeof createProposalSchema>, 
  creatorAddress: string, 
  txHash?: string,
  existingMetadataURI?: string
) {
  // 1. Validate on server
  const validated = createProposalSchema.safeParse(input);
  if (!validated.success) {
    const firstError = validated.error.issues[0];
    throw new Error(`${firstError.path.join(".")}: ${firstError.message}`);
  }

  // 2. Prepare or reuse metadata
  let metadataURI = existingMetadataURI;
  if (!metadataURI) {
    const metadata = {
      title: validated.data.title,
      description: validated.data.description,
      coverImage: validated.data.coverImage,
      createdAt: Date.now(), 
    };
    metadataURI = `local://${encodeURIComponent(JSON.stringify(metadata))}`;
  }

  const tempId = -Math.abs(Math.floor(Date.now() / 1000));
  const decimals = 18; 

  const goalUnits = parseUnits(validated.data.goal, decimals).toString();
  const minThresholdUnits = parseUnits(validated.data.minThreshold, decimals).toString();

  const supabase = createAdminClient();
  
  const { data: saved, error } = await supabase.from("proposals").upsert({
    id: tempId,
    creator: creatorAddress.toLowerCase(),
    recipient: validated.data.recipient.toLowerCase(),
    token: "0x0000000000000000000000000000000000000000", 
    decimals: decimals,
    goal: goalUnits,
    min_threshold: minThresholdUnits,
    deadline: Math.floor(Date.now() / 1000) + Number(validated.data.duration),
    status: "pending",
    title: validated.data.title,
    description: validated.data.description,
    image_url: validated.data.coverImage,
    metadata_uri: metadataURI,
    tx_hash: txHash ? txHash.toLowerCase() : null,
    created_at: Math.floor(Date.now() / 1000)
  }, { onConflict: 'id' }).select().single();

  if (error) {
    console.error("Error saving pending proposal:", error.message);
  }

  return {
    tempId: saved?.id || tempId,
    metadataURI,
    ...validated.data,
    durationSeconds: Number(validated.data.duration),
  };
}

/**
 * Updates the tx_hash of an existing pending proposal.
 */
export async function updateProposalTxHash(tempId: number, txHash: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("proposals")
    .update({ tx_hash: txHash.toLowerCase() })
    .eq("id", tempId);
    
  if (error) {
    console.error("Error updating tx_hash:", error.message);
  }
}
