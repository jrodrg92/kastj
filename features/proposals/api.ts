import { formatEther } from "../../lib/currencyUtils";
import { supabase } from "../../lib/supabase";

export const PAGE_SIZE = 12;

export interface ProposalListItem {
  id: number;
  creator: string;
  recipient: string;
  asset: { type: "native" } | { type: "krc20"; tokenAddress: `0x${string}` };
  goal: string;
  minThreshold: string;
  totalRaised: string;
  deadline: number;
  status: number;
  metadataURI: string | null;
}

function parseStatus(status: string | number) {
  if (status === 0 || status === "active") return 0;
  if (status === 1 || status === "succeeded") return 1;
  if (status === 2 || status === "failed") return 2;
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProposal(proposal: any): ProposalListItem {
  return {
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
    minThreshold: formatEther(
      BigInt(proposal.min_threshold ?? proposal.goal ?? 0),
    ),
    totalRaised: formatEther(BigInt(proposal.total_raised ?? 0)),
    deadline: Number(proposal.deadline),
    status: parseStatus(proposal.status),
    metadataURI: proposal.metadata_uri,
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
  const { data, error } = await supabase
    .from("proposals")
    .select("status, total_raised");

  if (error) {
    console.error(error);
    throw error;
  }

  const total = data.length;
  const active = data.filter((p) => p.status === 0 || p.status === "active").length;
  const succeeded = data.filter((p) => p.status === 1 || p.status === "succeeded").length;
  const failed = data.filter((p) => p.status === 2 || p.status === "failed").length;
  const raised = data.reduce((acc, p) => acc + Number(formatEther(BigInt(p.total_raised || 0))), 0);

  return { total, active, succeeded, failed, raised };
}
