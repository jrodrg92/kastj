import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ProposalClient from "./ProposalClient";

function parseMetadata(uri?: string) {
  if (!uri?.startsWith("local://") && !uri?.startsWith("supabase://")) {
    return {
      title: "Kastj proposal",
      description: "Conditional crowdfunding proposal on Kastj.",
    };
  }

  try {
    const raw = uri.replace("local://", "").replace("supabase://", "");
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return {
      title: "Kastj proposal",
      description: "Conditional crowdfunding proposal on Kastj.",
    };
  }
}

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data } = await supabaseServer
    .from("proposals")
    .select(`
      id,
      metadata_uri,
      proposal_metadata (
        title,
        description
      )
    `)
    .eq("id", Number(id))
    .single();

  const metadata =
    (data?.proposal_metadata as any) ?? parseMetadata(data?.metadata_uri);

  const title = metadata?.title
    ? `Kastj — ${metadata.title}`
    : `Kastj — Proposal #${id}`;

  const description =
    metadata?.description ??
    "Conditional crowdfunding proposal on Kastj.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Kastj",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ProposalPage() {
  return <ProposalClient />;
}