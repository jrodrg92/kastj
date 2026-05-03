"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { proposalKeys } from "../queryKeys";

export function useProposalActivity(proposalId: number) {
  return useQuery({
    queryKey: [...proposalKeys.detail(proposalId), "activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("id", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!proposalId,
  });
}
