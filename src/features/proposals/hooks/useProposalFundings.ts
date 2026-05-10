"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { proposalKeys } from "../queryKeys";

export function useProposalFundings(proposalId: number) {
  return useQuery({
    queryKey: [...proposalKeys.detail(proposalId), "fundings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fundings")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("id", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!proposalId,
  });
}
