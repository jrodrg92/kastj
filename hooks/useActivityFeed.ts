"use client";

import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import { supabase } from "../lib/supabase";

export function useActivityFeed() {
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);

  async function loadActivity() {
    setLoadingActivity(true);

    const { data, error } = await supabase
      .from("activity")
      .select("*")
      .order("id", { ascending: false })
      .limit(10);

    setLoadingActivity(false);

    if (error) {
      console.error(error);
      return;
    }

    setActivity(data ?? []);
  }

  useEffect(() => {
    loadActivity();

    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity" },
        () => loadActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    activity,
    loadingActivity,
    loadActivity,
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