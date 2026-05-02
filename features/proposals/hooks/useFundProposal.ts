"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FundProposalInput, ProposalEngineContext } from "@/core/engines/types";
import { getProposalEngine } from "@/core/engines/proposalEngineFactory";
import { proposalKeys } from "../queryKeys";

export function useFundProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FundProposalInput) => {
      if (!ctx) {
        throw new Error("Wallet not connected");
      }

      const engine = getProposalEngine();
      return engine.fundProposal(ctx, input);
    },
    onSuccess: async (_result, input) => {
      toast.success("Proposal funded");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: proposalKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: proposalKeys.detail(input.proposalId),
        }),
      ]);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Could not fund proposal");
    },
  });
}