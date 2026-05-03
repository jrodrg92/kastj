"use client";

import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "../queryKeys";
import { fetchProposal } from "../api";

export function useProposal(id: number) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => fetchProposal(id),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data ? false : 2000), // Reintenta cada 2s si no existe
  });
}
