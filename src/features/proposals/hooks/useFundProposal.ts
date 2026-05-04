"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FundProposalInput, ProposalEngineContext } from "@/engines/proposal-engine.interface";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";
import { proposalKeys } from "../queryKeys";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useUi } from "../../../contexts/UiContext";
import { fireConfetti } from "../../../lib/confetti";

export function useFundProposal(ctx: ProposalEngineContext | null) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { setTxStatus } = useUi();

  return useMutation({
    mutationFn: async (input: FundProposalInput) => {
      if (!ctx) throw new Error("Wallet not connected");

      // 1. Review/Signing Step
      setTxStatus({ state: "signing", step: "submit" });
      
      const engine = getProposalEngine();
      
      const ctxWithProgress: ProposalEngineContext = {
        ...ctx,
        onProgress: (p) => setTxStatus(p as any)
      };

      const result = await engine.submit(ctxWithProgress, { 
        type: "proposal.fund", 
        proposalId: input.proposalId,
        amount: input.amount,
        asset: input.asset
      });

      // 2. Broadcasted Step
      setTxStatus({ 
        state: "processing", 
        step: "pending",
        txHash: result.txId 
      });

      return result;
    },
    onSuccess: async (_result, input) => {
      // 3. Final Verification Step (Simplified for now)
      setTxStatus({ 
        state: "success", 
        step: "verified",
        txHash: _result.txId,
        message: t.proposalFunded 
      });
      
      fireConfetti();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: proposalKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: proposalKeys.detail(input.proposalId),
        }),
      ]);
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
        message: error.message || t.fundError 
      });
    },
  });
}