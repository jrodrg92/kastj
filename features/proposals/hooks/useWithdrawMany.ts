"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ProposalEngineContext, ProposalId } from "@/core/engines/types";
import { getProposalEngine } from "@/core/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";

export function useWithdrawMany(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposalIds: ProposalId[]) => {
      if (!ctx) {
        throw new Error("Wallet not connected");
      }

      const engine = getProposalEngine();
      return engine.withdrawMany(ctx, proposalIds);
    },
    onSuccess: async () => {
      toast.success("Funds withdrawn");

      await queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Could not withdraw funds");
    },
  });
}
