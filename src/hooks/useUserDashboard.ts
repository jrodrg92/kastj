"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther } from "ethers";
import { supabase } from "../lib/supabase-client";

interface UserDashboardData {
  totalContributed: string;
  activeContributed: string;
  withdrawable: string;
  createdCount: number;
  supportedCount: number;
  supportedIds: number[];
  withdrawableIds: number[];
}

const EMPTY_DASHBOARD: UserDashboardData = {
  totalContributed: "0",
  activeContributed: "0",
  withdrawable: "0",
  createdCount: 0,
  supportedCount: 0,
  supportedIds: [],
  withdrawableIds: [],
};

function dashboardKey(address?: string) {
  return ["user-dashboard", address ?? ""] as const;
}

async function fetchDashboard(
  address: string,
): Promise<UserDashboardData> {
  const [fundingsRes, createdRes] = await Promise.all([
    supabase
      .from("fundings")
      .select(`proposal_id, amount, proposals ( id, status )`)
      .eq("supporter", address),
    supabase.from("proposals").select("id").eq("creator", address),
  ]);

  if (fundingsRes.error) throw fundingsRes.error;
  if (createdRes.error) throw createdRes.error;

  let total = 0n;
  let active = 0n;
  let withdrawable = 0n;

  const supportedIds = new Set<number>();
  const withdrawableIds: number[] = [];

  for (const funding of fundingsRes.data ?? []) {
    const amount = BigInt(funding.amount);
    const linked = funding.proposals as unknown as
      | { id: number; status: string }
      | { id: number; status: string }[]
      | null;
    const proposalStatus = Array.isArray(linked)
      ? linked[0]?.status
      : linked?.status;

    total += amount;
    supportedIds.add(Number(funding.proposal_id));

    if (proposalStatus === "active") {
      active += amount;
    }

    if (proposalStatus === "failed") {
      withdrawable += amount;
      withdrawableIds.push(Number(funding.proposal_id));
    }
  }

  return {
    totalContributed: formatEther(total),
    activeContributed: formatEther(active),
    withdrawable: formatEther(withdrawable),
    createdCount: createdRes.data?.length ?? 0,
    supportedCount: supportedIds.size,
    supportedIds: Array.from(supportedIds),
    withdrawableIds: Array.from(new Set(withdrawableIds)),
  };
}

export function useUserDashboard(address?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: dashboardKey(address),
    queryFn: () => fetchDashboard(address!),
    enabled: Boolean(address),
  });

  // Real-time subscription: invalidate on changes to fundings or proposals
  useEffect(() => {
    if (!address) return;

    const channel = supabase
      .channel(`user-dashboard-${address}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fundings" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: dashboardKey(address),
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proposals" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: dashboardKey(address),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, queryClient]);

  return {
    dashboard: query.data ?? EMPTY_DASHBOARD,
    loadingUserDashboard: query.isLoading,
    loadUserDashboard: query.refetch,
  };
}