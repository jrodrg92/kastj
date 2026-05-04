"use client";

import { useMemo } from "react";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";
import type { ProposalEngineContext } from "@/engines/proposal-engine.interface";

export function useProposalEngine(account?: string, signer?: unknown, provider?: unknown) {
    const engine = useMemo(() => getProposalEngine(), []);

    const ctx: ProposalEngineContext | null = account
        ? {
              chain: engine.chainKind,
              account,
              signer,
              provider,
          }
        : null;

    return {
        engine,
        ctx,
        isReady: Boolean(ctx),
    };
}