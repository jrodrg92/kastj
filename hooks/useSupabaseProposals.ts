"use client";

import { useState, useEffect } from "react";
import { formatEther } from "ethers";
import { supabase } from "../lib/supabase";

export function useSupabaseProposals() {
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbProposals, setDbProposals] = useState<any[]>([]);

  async function loadDbProposals() {
    setLoadingDb(true);

    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("id", { ascending: false });

    setLoadingDb(false);

    if (error) {
      console.error("Supabase error:", error);
      return;
    }

    setDbProposals(
      (data || []).map((p) => ({
        id: Number(p.id),
        creator: p.creator,
        recipient: p.recipient,
        goal: formatEther(BigInt(p.goal)),
        deadline: Number(p.deadline),
        totalRaised: formatEther(BigInt(p.total_raised)),
        status:
          p.status === "active"
            ? 0
            : p.status === "succeeded"
              ? 1
              : 2,
        executed: p.status !== "active",
        metadataURI: p.metadata_uri,
      }))
    );
  }

  // 🔴 REALTIME
  useEffect(() => {
    loadDbProposals(); // carga inicial

    const channel = supabase
      .channel("realtime-proposals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
        },
        () => {
          // cada cambio → refresca
          loadDbProposals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    loadingDb,
    dbProposals,
    loadDbProposals,
  };
}