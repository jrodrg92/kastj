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
import { SettlementMode } from "@/core/proposal/proposal.types";
import { AssetRegistry } from "@/core/assets/AssetRegistry";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("10000");
  const [duration, setDuration] = useState("604800"); // 7 days default
  const [minThreshold, setMinThreshold] = useState("");
  const [settlementMode, setSettlementMode] = useState<SettlementMode>("DeadlineOnly");

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
        asset: AssetRegistry.getNativeAsset(ctx?.chain || "mock"),
        goal: prepared.goal,
        minThreshold: prepared.minThreshold,
        durationSeconds: prepared.durationSeconds,
        metadataURI: prepared.metadataURI,
        settlementMode: settlementMode,
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
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Glows - Theme aware */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      <AppHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-20 md:px-8">
        <div className="mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link 
              href="/proposals" 
              className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:text-cyan-500"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> 
              {t.backToProposals}
            </Link>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
                Lanza tu <br />
                <span className="text-gradient-cyan">Propuesta</span>
              </h1>
              <p className="max-w-md text-muted-foreground text-sm font-medium leading-relaxed">
                {t.launchYourIdeaDesc}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex items-center gap-4 rounded-3xl bg-muted/30 p-6 border border-border backdrop-blur-md"
            >
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-inner">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-foreground uppercase tracking-widest">Creator Mode</p>
                <p className="text-[10px] text-muted-foreground font-medium">Build, fund, and grow on Kaspa</p>
              </div>
            </motion.div>
          </div>
        </div>

        <ScrollReveal>
          <div className="premium-glass rounded-[3rem] p-1 shadow-2xl dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="bg-card/20 rounded-[2.9rem] overflow-hidden backdrop-blur-3xl">
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
                settlementMode={settlementMode}
                onSettlementModeChange={setSettlementMode}
                onCreate={handleCreate}
                descriptionPlaceholder={DESCRIPTION_TEMPLATE}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom Decorative Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { title: "Deterministic", desc: "Every proposal address is derived from its unique parameters." },
             { title: "Immutable", desc: "Once deployed, the escrow terms cannot be altered by anyone." },
             { title: "Secure", desc: "Funds are locked in a native script, only releasable by the recipient." }
           ].map((feat, i) => (
             <div key={i} className="space-y-2 p-4">
                <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{feat.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">{feat.desc}</p>
             </div>
           ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
