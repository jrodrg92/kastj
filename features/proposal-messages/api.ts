import { supabase } from "../../lib/supabase";
import {
  hashProposalMessageBody,
  validateProposalMessageBody,
  validateProposalMessageType,
} from "../../core/domain/ProposalMessageRules";
import type {
  ProposalMessage,
  ProposalMessageType,
  ProposalMessageAuthorRole,
} from "../../core/domain/ProposalMessage";

/**
 * Fetches all messages for a specific proposal.
 */
export async function listProposalMessages(
  proposalId: string
): Promise<ProposalMessage[]> {
  const { data, error } = await supabase
    .from("proposal_messages")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map(mapProposalMessage);
}

/**
 * Creates a new message for a proposal.
 */
export async function createProposalMessage(input: {
  proposalId: string;
  parentId?: string | null;
  authorWallet: string;
  authorRole: ProposalMessageAuthorRole;
  type: ProposalMessageType;
  body: string;
}): Promise<ProposalMessage> {
  const body = validateProposalMessageBody(input.body);
  const type = validateProposalMessageType(input.type, input.authorRole);
  const bodyHash = hashProposalMessageBody(body);

  const { data, error } = await supabase
    .from("proposal_messages")
    .insert({
      proposal_id: input.proposalId,
      parent_id: input.parentId ?? null,
      author_wallet: input.authorWallet,
      author_role: input.authorRole,
      message_type: type,
      body,
      body_hash: bodyHash,
    })
    .select("*")
    .single();

  if (error) throw error;

  return mapProposalMessage(data);
}

/**
 * Soft-deletes a message (hides content but keeps metadata).
 */
export async function softDeleteProposalMessage(
  messageId: string,
  authorWallet: string
): Promise<void> {
  const { error } = await supabase
    .from("proposal_messages")
    .update({ is_deleted: true })
    .eq("id", messageId)
    .eq("author_wallet", authorWallet);

  if (error) throw error;
}

/**
 * Pins or unpins a message.
 */
export async function togglePinProposalMessage(
  messageId: string,
  isPinned: boolean
): Promise<void> {
  const { error } = await supabase
    .from("proposal_messages")
    .update({ is_pinned: isPinned })
    .eq("id", messageId);

  if (error) throw error;
}

/**
 * Maps Supabase row to ProposalMessage domain type.
 */
function mapProposalMessage(row: any): ProposalMessage {
  return {
    id: row.id,
    proposalId: String(row.proposal_id),
    parentId: row.parent_id,
    authorWallet: row.author_wallet,
    authorRole: row.author_role as ProposalMessageAuthorRole,
    type: row.message_type as ProposalMessageType,
    body: row.is_deleted ? "" : row.body,
    bodyHash: row.body_hash,
    isDeleted: row.is_deleted,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
