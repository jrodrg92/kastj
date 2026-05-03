"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { proposalKeys } from "../queryKeys";
import { fetchProposalsPage } from "../api";

export function useInfiniteProposals() {
  return useInfiniteQuery({
    queryKey: [...proposalKeys.lists(), "infinite"],
    queryFn: ({ pageParam = 0 }) => fetchProposalsPage(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}
