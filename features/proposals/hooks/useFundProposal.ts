"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FundProposalInput, ProposalEngineContext } from "@/core/engines/types";
import { getProposalEngine } from "@/core/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";
import { useLanguage } from "../../../contexts/LanguageContext";

export function useFundProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (input: FundProposalInput) => {
      if (!ctx) {
        throw new Error("Wallet not connected");
      }

      const engine = getProposalEngine();
      return engine.fundProposal(ctx, input);
    },
    onSuccess: async (_result, input) => {
      toast.success(t.proposalFunded);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: proposalKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: proposalKeys.detail(input.proposalId),
        }),
      ]);
    },
    onError: (error: any) => {
      if (error.code === "ACTION_REJECTED" || error.code === 4001) return;
      console.error(error);
      toast.error(t.fundError);
    },
  });
}