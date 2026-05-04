"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AppHeader } from "@/components/layout/AppHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreateProposalForm } from "@/components/proposal/CreateProposalForm";
import { useWalletContext } from "@/contexts/WalletContext";
import { useProposalEngine } from "@/hooks/useProposalEngine";
import { useCreateProposal } from "@/features/proposals/hooks/useCreateProposal";
import { prepareProposalMetadata, updateProposalTxHash } from "@/features/proposals/actions";
import { calculateMinThreshold } from "@/core/proposal/proposal.thresholds";
import { parseUnits, formatUnits, DECIMALS } from "@/lib/currencyUtils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const DESCRIPTION_TEMPLATE = `## About
What are you proposing?

## Why it matters
Why should the Kaspa community care?

## Use of funds
How will the KAS be used?

## Timeline
What will be delivered and when?

## Risks
What could go wrong?

## Call to action
Why should people contribute?`;

export default function CreateProposalClient() {
  const router = useRouter();
  const wallet = useWalletContext();
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);
  const { t } = useLanguage();
  const createMutation = useCreateProposal(ctx);

  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState(DESCRIPTION_TEMPLATE);
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("10000");
  const [duration, setDuration] = useState("604800"); // 7 days default
  const [minThreshold, setMinThreshold] = useState("");

  const autoThresholdStr = useMemo(() => {
    try {
      const decimals = ctx?.chain === "kasplex-zkevm" ? DECIMALS.IKAS_L2 : DECIMALS.KAS_L1;
      const g = parseUnits(goal || "0", decimals);
      const d = Number(duration || "0");
      const wei = calculateMinThreshold(g, d, decimals);
      return formatUnits(wei, decimals);
    } catch {
      return "0";
    }
  }, [goal, duration, ctx?.chain]);

  useEffect(() => {
    if (!minThreshold || Number(minThreshold) < Number(autoThresholdStr)) {
      setMinThreshold(autoThresholdStr);
    }
  }, [autoThresholdStr, minThreshold]);

  async function handleCreate() {
    if (!wallet.connected) {
      toast.error(t.connectWalletFirst);
      return;
    }

    try {
      const prepared = await prepareProposalMetadata({
        title,
        coverImage,
        description,
        recipient,
        goal,
        minThreshold,
        duration,
      }, wallet.address || "");

      const result = await createMutation.mutateAsync({
        recipient: prepared.recipient,
        asset: { 
          type: "native", 
          symbol: "KAS", 
          decimals: ctx?.chain === "kasplex-zkevm" ? DECIMALS.IKAS_L2 : DECIMALS.KAS_L1 
        },
        goal: prepared.goal,
        minThreshold: prepared.minThreshold,
        durationSeconds: prepared.durationSeconds,
        metadataURI: prepared.metadataURI,
      });

      if (result?.txId) {
        await updateProposalTxHash(prepared.tempId, result.txId);
        toast.success(t.proposalCreated);
        router.push(`/proposal/${prepared.tempId}?tx=${result.txId}`);
      } else {
        toast.success(t.proposalCreated);
        router.push("/proposals");
      }
    } catch (e: any) {
      toast.error(e.message || t.createError);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <ScrollReveal>
          <div className="mb-10 flex items-center justify-between">
            <div>
              <Link href="/proposals" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-cyan-500">
                <ArrowLeft size={16} /> {t.backToProposals}
              </Link>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{t.launchYourIdea}</h1>
              <p className="mt-2 text-muted-foreground">{t.launchYourIdeaDesc}</p>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/[0.05] bg-white/[0.01] p-1 shadow-2xl overflow-hidden">
            <CreateProposalForm
              title={title}
              coverImage={coverImage}
              description={description}
              recipient={recipient}
              goal={goal}
              minThreshold={minThreshold}
              autoThreshold={autoThresholdStr}
              duration={duration}
              loading={createMutation.isPending}
              connected={wallet.connected}
              onTitleChange={setTitle}
              onCoverImageChange={setCoverImage}
              onDescriptionChange={setDescription}
              onRecipientChange={setRecipient}
              onGoalChange={setGoal}
              onMinThresholdChange={setMinThreshold}
              onDurationChange={setDuration}
              onCreate={handleCreate}
            />
          </div>
        </ScrollReveal>
      </main>

      <SiteFooter />
    </div>
  );
}
