"use client";

import { useQuery } from "@tanstack/react-query";
import { getProposals } from "../api/getProposals";
import { proposalKeys } from "../queryKeys";

export function useProposals() {
  return useQuery({
    queryKey: proposalKeys.lists(),
    queryFn: getProposals,
  });
}