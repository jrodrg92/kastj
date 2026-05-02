"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ProposalEngineContext, CreateProposalInput } from "@/core/engines/types";
import { getProposalEngine } from "@/core/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";
import { useLanguage } from "../../../contexts/LanguageContext";

export function useCreateProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      if (!ctx) {
        throw new Error("Wallet not connected");
      }

      const engine = getProposalEngine();
      return engine.createProposal(ctx, input);
    },
    onSuccess: async () => {
      toast.success(t.proposalCreated);
      await queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error(t.createError);
    },
  });
}