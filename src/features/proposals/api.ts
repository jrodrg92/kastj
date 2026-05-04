import { formatUnits, DECIMALS } from "../../lib/currencyUtils";
import { supabase } from "../../lib/supabase-client";
import { ProposalView, ProposalStatus } from "@/core/proposal/proposal.types";
import { RawProposal } from "./db.types";

export const PAGE_SIZE = 12;

function parseStatus(status: string | number | null): ProposalStatus {
  if (status === 0 || status === "active" || status === "0") return "active";
  if (status === 1 || status === "succeeded" || status === "1") return "succeeded";
  if (status === 2 || status === "failed" || status === "2") return "failed";
  return "active";
}

// Column selection string to avoid select("*") and over-fetching
const PROPOSAL_COLUMNS = `
  id, creator, recipient, token, decimals, 
  goal, min_threshold, total_raised, deadline, 
  status, metadata_uri, tx_hash, title, 
  description, image_url
`;

export function mapProposal(proposal: RawProposal): ProposalView {
  const isNative = !proposal.token || proposal.token === "0x0000000000000000000000000000000000000000";
  const decimals = Number(proposal.decimals ?? (isNative ? DECIMALS.IKAS_L2 : 18));
  const symbol = isNative ? "KAS" : (proposal.token_symbol || "TOKEN");

  const goalRaw = BigInt(proposal.goal || "0");
  const minThresholdRaw = BigInt(proposal.min_threshold || proposal.goal || "0");
  const totalRaisedRaw = BigInt(proposal.total_raised || "0");

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
    goal: {
      value: formatUnits(goalRaw, decimals),
      raw: goalRaw.toString(),
      symbol,
      decimals
    },
    minThreshold: {
      value: formatUnits(minThresholdRaw, decimals),
      raw: minThresholdRaw.toString(),
      symbol,
      decimals
    },
    totalRaised: {
      value: formatUnits(totalRaisedRaw, decimals),
      raw: totalRaisedRaw.toString(),
      symbol,
      decimals
    },
    deadline: Number(proposal.deadline) * 1000,
    status: parseStatus(proposal.status),
    metadataURI: proposal.metadata_uri,
    txHash: proposal.tx_hash,
    title: proposal.title,
    description: proposal.description,
    imageUrl: proposal.image_url,
  };
}

export async function fetchProposalsPage(pageParam = 0) {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
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
    .select(PROPOSAL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw error;
  }

  return data ? mapProposal(data) : null;
}

/**
 * Highly optimized statistics fetch using a database RPC.
 * Replaces the previous client-side calculation that required fetching all proposals.
 */
export async function fetchStats() {
  try {
    const { data, error } = await supabase.rpc('get_platform_stats');

    if (error) {
      console.error("Error fetching optimized stats:", error);
      // Fallback or re-throw
      return { total: 0, active: 0, succeeded: 0, failed: 0, raised: 0 };
    }

    return {
      total: Number(data.total || 0),
      active: Number(data.active || 0),
      succeeded: Number(data.succeeded || 0),
      failed: Number(data.failed || 0),
      raised: Number(data.raised || 0),
    };
  } catch (err) {
    console.error("Failed to fetch platform stats via RPC:", err);
    return { total: 0, active: 0, succeeded: 0, failed: 0, raised: 0 };
  }
}

