"use client";

import { useQuery } from "@tanstack/react-query";
import { formatEther } from "../../../lib/currencyUtils";
import { supabase } from "../../../lib/supabase";
import { proposalKeys } from "../queryKeys";

function parseStatus(status: string | number) {
  if (status === 0 || status === "active") return 0;
  if (status === 1 || status === "succeeded") return 1;
  if (status === 2 || status === "failed") return 2;
  return 0;
}

export function useProposals() {
  return useQuery({
    queryKey: proposalKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        throw error;
      }

      return (data ?? []).map((proposal) => ({
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
        minThreshold: formatEther(BigInt(proposal.min_threshold ?? proposal.goal ?? 0)),
        totalRaised: formatEther(BigInt(proposal.total_raised ?? 0)),
        deadline: Number(proposal.deadline),
        status: parseStatus(proposal.status),
        metadataURI: proposal.metadata_uri,
      }));
    },
  });
}