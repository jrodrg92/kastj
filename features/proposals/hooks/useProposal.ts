"use client";

import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "../queryKeys";
import { fetchProposal } from "../api";

export function useProposal(id: number) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => fetchProposal(id),
    enabled: !!id,
  });
}
