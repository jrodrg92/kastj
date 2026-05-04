"use client";

import { useState } from "react";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";
import { ProposalView } from "@/core/proposal/proposal.types";
import { ProposalEngineContext } from "@/engines/proposal-engine.interface";
import { VerificationResult } from "@/engines/proposal-engine.interface";
import toast from "react-hot-toast";

export function useVerifyProposal(ctx: ProposalEngineContext | null) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verify = async (proposal: ProposalView) => {
    if (!ctx?.provider) {
      toast.error("Connect wallet or provider to verify on-chain");
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const engine = getProposalEngine();
      const res = await engine.verify(proposal.id, ctx.provider);
      
      setResult(res);
      
      if (res.status === "verified") {
        toast.success("On-chain verification successful! Integrity confirmed.");
      } else if (res.status === "failed") {
        toast.error(`VERIFICATION FAILED: ${res.reason}`);
      } else {
        toast.error("Verification not supported for this engine.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(`Verification error: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return { 
    verify, 
    isVerifying, 
    result,
    isVerified: result === null ? null : result.status === "verified"
  };
}
