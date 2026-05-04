"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProposalEngineContext, CreateProposalInput } from "@/engines/proposal-engine.interface";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useUi } from "../../../contexts/UiContext";
import { fireConfetti } from "../../../lib/confetti";

export function useCreateProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { setTxStatus } = useUi();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      if (!ctx) throw new Error("Wallet not connected");

      setTxStatus({ state: "signing", step: "submit" });

      const engine = getProposalEngine();
      const result = await engine.submit(ctx, { type: "proposal.create", input });

      setTxStatus({ 
        state: "processing", 
        step: "pending",
        txHash: result.txId 
      });

      return result;
    },
    onSuccess: async (_result) => {
      setTxStatus({ 
        state: "success", 
        step: "verified",
        txHash: _result.txId,
        message: t.proposalCreated 
      });

      fireConfetti();

      await queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
    },
    onError: (error: any) => {
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        setTxStatus({ state: "idle" });
        return;
      }
      
      console.error(error);
      setTxStatus({ 
        state: "error", 
        step: "submit",
        message: error.message || t.createError 
      });
    },
  });
}