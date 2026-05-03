"use client";

import { useMemo } from "react";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";
import type { ProposalEngineContext } from "@/engines/proposal-engine.interface";

export function useProposalEngine(account?: string, signer?: unknown) {
    const engine = useMemo(() => getProposalEngine(), []);

    const ctx: ProposalEngineContext | null = account
        ? {
              chain: engine.kind,
              account,
              signer,
          }
        : null;

    return {
        engine,
        ctx,
        isReady: Boolean(ctx),
    };
}