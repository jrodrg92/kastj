"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther } from "ethers";
import { supabase } from "../lib/supabase";
import type { DbActivity } from "../types/supabase";

const ACTIVITY_KEY = ["activity", "feed"] as const;

export function useActivityFeed() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ACTIVITY_KEY,
    queryFn: async (): Promise<DbActivity[]> => {
      const { data, error } = await supabase
        .from("activity")
        .select("*")
        .order("id", { ascending: false })
        .limit(10);

      if (error) {
        console.error(error);
        throw error;
      }

      return (data ?? []) as DbActivity[];
    },
  });

  // Real-time subscription: invalidate query on new activity
  useEffect(() => {
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    activity: query.data ?? [],
    loadingActivity: query.isLoading,
    loadActivity: query.refetch,
  };
}

export function formatActivityAmount(amount?: string | null) {
  if (!amount) return null;

  try {
    return formatEther(BigInt(amount));
  } catch {
    return null;
  }
}