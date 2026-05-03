"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useUi } from "../../../contexts/UiContext";
import { fireConfetti } from "../../../lib/confetti";
import { ProposalId } from "@/core/proposal/proposal.types";
import { ProposalEngineContext } from "@/engines/proposal-engine.interface";

export function useFinalizeProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { setTxStatus } = useUi();

  return useMutation({
    mutationFn: async (proposalId: ProposalId) => {
      if (!ctx) throw new Error("Wallet not connected");

      setTxStatus({ state: "signing", message: "Finalizing proposal and settling funds..." });
      
      const engine = getProposalEngine();
      const result = await engine.submit(ctx, { 
        type: "FinalizeProposal", 
        proposalId,
        nowMs: Date.now()
      });

      setTxStatus({ 
        state: "processing", 
        txHash: result.txId 
      });

      return result;
    },
    onSuccess: async (_result, proposalId) => {
      setTxStatus({ 
        state: "success", 
        txHash: _result.txId,
        message: t.proposalFinalized || "Proposal settled successfully!" 
      });
      
      fireConfetti();

      await queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(proposalId),
      });
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
      setTxStatus({ state: "error", message: error.message || t.finalizeError });
    },
  });
}