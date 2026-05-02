"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import {
  createProposalMessage,
  listProposalMessages,
  softDeleteProposalMessage,
  togglePinProposalMessage,
} from "./api";
import type {
  ProposalMessageAuthorRole,
  ProposalMessageType,
} from "../../core/domain/ProposalMessage";

/**
 * Hook to fetch and subscribe to messages for a proposal.
 */
export function useProposalMessages(proposalId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["proposal-messages", proposalId],
    queryFn: () => listProposalMessages(proposalId),
    enabled: Boolean(proposalId),
  });

  useEffect(() => {
    if (!proposalId) return;

    // Realtime subscription
    const channel = supabase
      .channel(`proposal-messages:${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposal_messages",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => {
          // Invalidate and refetch
          queryClient.invalidateQueries({
            queryKey: ["proposal-messages", proposalId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId, queryClient]);

  return query;
}

/**
 * Hook to create a new message.
 */
export function useCreateProposalMessage(proposalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      parentId?: string | null;
      authorWallet: string;
      authorRole: ProposalMessageAuthorRole;
      type: ProposalMessageType;
      body: string;
    }) =>
      createProposalMessage({
        proposalId,
        ...input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proposal-messages", proposalId],
      });
    },
  });
}

/**
 * Hook to soft-delete a message.
 */
export function useSoftDeleteMessage(proposalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { messageId: string; authorWallet: string }) =>
      softDeleteProposalMessage(input.messageId, input.authorWallet),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proposal-messages", proposalId],
      });
    },
  });
}

/**
 * Hook to toggle pin state of a message.
 */
export function useTogglePinMessage(proposalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { messageId: string; isPinned: boolean }) =>
      togglePinProposalMessage(input.messageId, input.isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proposal-messages", proposalId],
      });
    },
  });
}
