"use client";

import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import { supabase } from "../lib/supabase";

export function useUserDashboard(address?: string) {
  const [loadingUserDashboard, setLoadingUserDashboard] = useState(false);
  const [dashboard, setDashboard] = useState({
    totalContributed: "0",
    activeContributed: "0",
    withdrawable: "0",
    createdCount: 0,
    supportedCount: 0,
    supportedIds: [] as number[],
    withdrawableIds: [] as number[],
  });

  async function loadUserDashboard() {
    if (!address) return;

    setLoadingUserDashboard(true);

    const { data: fundings, error: fundingsError } = await supabase
      .from("fundings")
      .select(`
        proposal_id,
        amount,
        proposals (
          id,
          status
        )
      `)
      .eq("supporter", address);

    const { data: created, error: createdError } = await supabase
      .from("proposals")
      .select("id")
      .eq("creator", address);

    setLoadingUserDashboard(false);

    if (fundingsError) {
      console.error(fundingsError);
      return;
    }

    if (createdError) {
      console.error(createdError);
      return;
    }

    let total = 0n;
    let active = 0n;
    let withdrawable = 0n;

    const supportedIds = new Set<number>();

    const withdrawableIds: number[] = [];

    for (const funding of fundings ?? []) {
      const amount = BigInt(funding.amount);
      const proposalStatus = (funding.proposals as any)?.status;

      total += amount;
      supportedIds.add(Number(funding.proposal_id));

      if (proposalStatus === "active") {
        active += amount;
      }

      if (proposalStatus === "failed") {
        withdrawable += amount;
        withdrawableIds.push(Number(funding.proposal_id));
      }

      if (proposalStatus === "failed") {
        withdrawable += amount;
        withdrawableIds.push(Number(funding.proposal_id));
      }
    }

    setDashboard({
      totalContributed: formatEther(total),
      activeContributed: formatEther(active),
      withdrawable: formatEther(withdrawable),
      createdCount: created?.length ?? 0,
      supportedCount: supportedIds.size,
      supportedIds: Array.from(supportedIds),
      withdrawableIds: Array.from(new Set(withdrawableIds)),
    });
  }

  useEffect(() => {
    loadUserDashboard();

    const channel = supabase
      .channel(`user-dashboard-${address}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fundings" },
        () => loadUserDashboard()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proposals" },
        () => loadUserDashboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address]);

  return {
    dashboard,
    loadingUserDashboard,
    loadUserDashboard,
  };
}