"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ProposalEngineContext, ProposalId } from "@/core/engines/types";
import { getProposalEngine } from "@/core/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";
import { useLanguage } from "../../../contexts/LanguageContext";

export function useWithdrawMany(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (proposalIds: ProposalId[]) => {
      if (!ctx) {
        throw new Error("Wallet not connected");
      }

      const engine = getProposalEngine();
      return engine.withdrawMany(ctx, proposalIds);
    },
    onSuccess: async () => {
      toast.success(t.withdrawSuccess);

      await queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error(t.withdrawError);
    },
  });
}
