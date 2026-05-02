"use client";

import { useMemo } from "react";
import { getProposalEngine } from "@/core/engines/ProposalEngineFactory";
import type { ProposalEngineContext } from "@/core/engines/types";

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