"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { formatEther } from "ethers";
import { supabase } from "../../../lib/supabase";
import { proposalKeys } from "../queryKeys";

const PAGE_SIZE = 12;

function parseStatus(status: string | number) {
  if (status === 0 || status === "active") return 0;
  if (status === 1 || status === "succeeded") return 1;
  if (status === 2 || status === "failed") return 2;
  return 0;
}

export interface ProposalListItem {
  id: number;
  creator: string;
  recipient: string;
  asset: { type: "native" } | { type: "krc20"; tokenAddress: `0x${string}` };
  goal: string;
  minThreshold: string;
  totalRaised: string;
  deadline: number;
  status: number;
  metadataURI: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProposal(proposal: any): ProposalListItem {
  return {
    id: Number(proposal.id),
    creator: proposal.creator,
    recipient: proposal.recipient,
    asset:
      !proposal.token ||
      proposal.token === "0x0000000000000000000000000000000000000000"
        ? { type: "native" as const }
        : {
            type: "krc20" as const,
            tokenAddress: proposal.token as `0x${string}`,
          },
    goal: formatEther(BigInt(proposal.goal ?? 0)),
    minThreshold: formatEther(
      BigInt(proposal.min_threshold ?? proposal.goal ?? 0),
    ),
    totalRaised: formatEther(BigInt(proposal.total_raised ?? 0)),
    deadline: Number(proposal.deadline),
    status: parseStatus(proposal.status),
    metadataURI: proposal.metadata_uri,
  };
}

export function useInfiniteProposals() {
  return useInfiniteQuery({
    queryKey: [...proposalKeys.lists(), "infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("id", { ascending: false })
        .range(from, to);

      if (error) {
        console.error(error);
        throw error;
      }

      const items = (data ?? []).map(mapProposal);

      return {
        items,
        nextPage: items.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}
