"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ProposalEngineContext, ProposalId } from "@/core/engines/types";
import { getProposalEngine } from "@/core/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";
import { useLanguage } from "../../../contexts/LanguageContext";

export function useFinalizeProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (proposalId: ProposalId) => {
      if (!ctx) {
        throw new Error("Wallet not connected");
      }

      const engine = getProposalEngine();
      return engine.finalizeProposal(ctx, proposalId);
    },
    onSuccess: async (_result, proposalId) => {
      toast.success(t.proposalFinalized);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: proposalKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: proposalKeys.detail(proposalId),
        }),
      ]);
    },
    onError: (error: any) => {
      if (error.code === "ACTION_REJECTED" || error.code === 4001) return;
      console.error(error);
      toast.error(t.finalizeError);
    },
  });
}