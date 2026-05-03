"use client";

import { useState } from "react";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";
import { ProposalView } from "@/core/proposal/proposal.types";
import { ProposalEngineContext } from "@/engines/proposal-engine.interface";
import toast from "react-hot-toast";

export function useVerifyProposal(ctx: ProposalEngineContext | null) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const verify = async (proposal: any) => {
    if (!ctx?.provider) {
      toast.error("Connect wallet or provider to verify on-chain");
      return;
    }

    setIsVerifying(true);
    setIsVerified(null);

    try {
      const engine = getProposalEngine();
      // We map the API proposal back to a partial ProposalView for the engine
      const view: ProposalView = {
        id: proposal.id,
        goal: { raw: proposal.goalRaw, value: proposal.goal, symbol: "KAS", decimals: 18 },
        totalRaised: { raw: proposal.totalRaisedRaw, value: proposal.totalRaised, symbol: "KAS", decimals: 18 },
        status: proposal.status === 0 ? "active" : proposal.status === 1 ? "succeeded" : "failed",
        recipient: proposal.recipient,
        creator: proposal.creator,
        deadline: new Date(proposal.deadline * 1000),
        asset: proposal.asset,
        canFinalize: false,
        canWithdraw: false
      };

      const isValid = await engine.verifyProposal(view, ctx.provider);
      
      setIsVerified(isValid);
      
      if (isValid) {
        toast.success("On-chain verification successful! Data matches.");
      } else {
        toast.error("ON-CHAIN DATA MISMATCH! Verification failed.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to fetch on-chain data for verification");
    } finally {
      setIsVerifying(false);
    }
  };

  return { verify, isVerifying, isVerified };
}
