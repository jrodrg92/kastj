import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import getQueryClient from "../../../lib/getQueryClient";
import { proposalKeys } from "../../../features/proposals/queryKeys";
import { fetchProposal } from "../../../features/proposals/api";
import { parseMetadataUri } from "../../../lib/proposalUtils";
import { supabase } from "../../../lib/supabase";
import ProposalClient from "./ProposalClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await fetchProposal(Number(id));
  
  const metadata = parseMetadataUri(proposal?.metadataURI);

  const raised = Number(proposal?.totalRaised ?? 0);
  const goal = Number(proposal?.goal ?? 0);
  const percent = goal > 0 ? Math.min((raised / goal) * 100, 100).toFixed(0) : "0";

  const title = metadata?.title
    ? `${percent}% — ${metadata.title} | Kastj`
    : `Kastj — Proposal #${id}`;

  const description = `${metadata?.description?.slice(0, 150) ?? "Conditional crowdfunding proposal"}. Goal: ${goal} KAS. Raised: ${raised} KAS (${percent}%).`;

  const ogImage = "/og-image.png"; // Fallback for now

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Kastj",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const proposalId = Number(id);
  const queryClient = getQueryClient();

  // Prefetch main proposal
  await queryClient.prefetchQuery({
    queryKey: proposalKeys.detail(proposalId),
    queryFn: () => fetchProposal(proposalId),
  });

  // Prefetch activity
  await queryClient.prefetchQuery({
    queryKey: [...proposalKeys.detail(proposalId), "activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("id", { ascending: false });
      return data ?? [];
    },
  });

  // Prefetch fundings
  await queryClient.prefetchQuery({
    queryKey: [...proposalKeys.detail(proposalId), "fundings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fundings")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("id", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProposalClient />
    </HydrationBoundary>
  );
}