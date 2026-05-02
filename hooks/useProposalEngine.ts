"use client";

import { useMemo } from "react";
import { getProposalEngine } from "@/core/engines/proposalEngineFactory";
import { ProposalEngineContext } from "@/core/engines/types";

export function useProposalEngine(account?: string) {
  const engine = useMemo(() => getProposalEngine(), []);

  const ctx: ProposalEngineContext | null = account
    ? {
        chain: engine.kind,
        account,
      }
    : null;

  return {
    engine,
    ctx,
    isReady: Boolean(ctx),
  };
}