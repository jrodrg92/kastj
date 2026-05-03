import { formatUnits, DECIMALS } from "../../lib/currencyUtils";
import { supabase } from "../../lib/supabase-client";

export const PAGE_SIZE = 12;

export interface ProposalListItem {
  id: number;
  creator: string;
  recipient: string;
  asset: { type: "native"; symbol: "KAS"; decimals: number } | { type: "krc20"; tokenAddress: `0x${string}`; symbol: string; decimals: number };
  goal: string;
  goalRaw: string;
  minThreshold: string;
  minThresholdRaw: string;
  totalRaised: string;
  totalRaisedRaw: string;
  decimals: number;
  deadline: number;
  status: number;
  metadataURI: string | null;
  tx_hash?: string | null;
  title?: string | null;
  description?: string | null;
}

function parseStatus(status: string | number) {
  if (status === 0 || status === "active") return 0;
  if (status === 1 || status === "succeeded") return 1;
  if (status === 2 || status === "failed") return 2;
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProposal(proposal: any): ProposalListItem {
  const isNative = !proposal.token || proposal.token === "0x0000000000000000000000000000000000000000";
  // Prioridad: 1. Decimales en DB, 2. Si es Nativo en L2 (18), 3. Default 18
  const decimals = Number(proposal.decimals ?? (isNative ? DECIMALS.IKAS_L2 : 18));
  const symbol = isNative ? "KAS" : (proposal.token_symbol || "TOKEN");

  const goalRaw = proposal.goal || "0";
  const minThresholdRaw = proposal.min_threshold || goalRaw;
  const totalRaisedRaw = proposal.total_raised || "0";

  return {
    id: Number(proposal.id),
    creator: proposal.creator,
    recipient: proposal.recipient,
    asset: isNative
      ? { type: "native" as const, symbol: "KAS", decimals: decimals }
      : {
          type: "krc20" as const,
          tokenAddress: proposal.token as `0x${string}`,
          symbol: symbol,
          decimals: decimals,
        },
    goal: formatUnits(goalRaw, decimals),
    goalRaw,
    minThreshold: formatUnits(minThresholdRaw, decimals),
    minThresholdRaw,
    totalRaised: formatUnits(totalRaisedRaw, decimals),
    totalRaisedRaw,
    decimals,
    deadline: Number(proposal.deadline),
    status: parseStatus(proposal.status),
    metadataURI: proposal.metadata_uri,
    tx_hash: proposal.tx_hash,
    title: proposal.title,
    description: proposal.description,
  };
}

export async function fetchProposalsPage(pageParam = 0) {
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
}

export async function fetchProposal(id: number) {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw error;
  }

  return data ? mapProposal(data) : null;
}

export async function fetchStats() {
  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("status, total_raised, token, decimals");

    if (error) {
      console.error("Error fetching stats:", error);
      return { total: 0, active: 0, succeeded: 0, failed: 0, raised: 0 };
    }

    if (!data || data.length === 0) {
      return { total: 0, active: 0, succeeded: 0, failed: 0, raised: 0 };
    }

    const total = data.length;
    const active = data.filter((p) => p.status === 0 || p.status === "active").length;
    const succeeded = data.filter((p) => p.status === 1 || p.status === "succeeded").length;
    const failed = data.filter((p) => p.status === 2 || p.status === "failed").length;

    const raisedBig = data.reduce((acc, p) => {
      const isNative = !p.token || p.token === "0x0000000000000000000000000000000000000000";
      const decimals = Number(p.decimals ?? (isNative ? DECIMALS.IKAS_L2 : 18));
      const valStr = (p.total_raised || "0").toString();
      
      try {
        const val = BigInt(valStr);
        const scaled = decimals < 18
          ? val * (10n ** BigInt(18 - decimals))
          : val / (10n ** BigInt(decimals - 18));
        return acc + scaled;
      } catch {
        return acc;
      }
    }, 0n);

    const raised = Number(formatUnits(raisedBig, 18));

    return { total, active, succeeded, failed, raised };
  } catch (err) {
    console.error("Failed to calculate stats:", err);
    return { total: 0, active: 0, succeeded: 0, failed: 0, raised: 0 };
  }
}

