"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ProposalEngineContext, CreateProposalInput } from "@/core/engines/types";
import { getProposalEngine } from "@/core/engines/proposalEngineFactory";
import { proposalKeys } from "../queryKeys";

export function useCreateProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      if (!ctx) {
        throw new Error("Wallet not connected");
      }

      const engine = getProposalEngine();
      return engine.createProposal(ctx, input);
    },
    onSuccess: async () => {
      toast.success("Proposal created");
      await queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Could not create proposal");
    },
  });
}