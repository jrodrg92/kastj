"use client";

import { useQuery } from "@tanstack/react-query";
import { getProposalEngine } from "@/core/engines/proposalEngineFactory";
import { normalizeProposalView } from "@/core/domain/normalizeProposal";
import { proposalKeys } from "../queryKeys";

export function useProposals() {
  return useQuery({
    queryKey: proposalKeys.lists(),
    queryFn: async () => {
      const engine = getProposalEngine();
      const proposals = await engine.listProposals();

      return proposals.map((proposal) => normalizeProposalView(proposal));
    },
  });
}