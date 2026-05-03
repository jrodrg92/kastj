"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AppHeader } from "../../../components/layout/AppHeader";
import { SiteFooter } from "../../../components/landing/SiteFooter";
import { ScrollReveal } from "../../../components/ui/ScrollReveal";
import { useLanguage } from "../../../contexts/LanguageContext";
import { CreateProposalForm } from "../../../components/proposal/CreateProposalForm";
import { useWalletContext } from "../../../contexts/WalletContext";
import { useProposalEngine } from "../../../hooks/useProposalEngine";
import { useCreateProposal } from "../../../features/proposals/hooks/useCreateProposal";
import { prepareProposalMetadata } from "../../../features/proposals/actions";
import { calculateMinThreshold } from "../../../core/domain/ThresholdRules";
import { parseUnits, formatUnits, DECIMALS } from "../../../lib/currencyUtils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase-client";

export default function CreateProposalClient() {
  const router = useRouter();
  const wallet = useWalletContext();
  const { ctx } = useProposalEngine(wallet.address, wallet.signer);
  const { t } = useLanguage();
  const createMutation = useCreateProposal(ctx);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("10000");
  const [duration, setDuration] = useState("86400");
  const [minThreshold, setMinThreshold] = useState("6000");

  const autoThresholdStr = useMemo(() => {
    try {
      const decimals = ctx?.chain === "kasplex-zkevm" ? 18 : DECIMALS.KAS;
      const g = parseUnits(goal || "0", decimals);
      const d = Number(duration || "0");
      const wei = calculateMinThreshold(g, d, decimals);
      return formatUnits(wei, decimals);
    } catch {
      return "0";
    }
  }, [goal, duration, ctx?.chain]);

  // Sync minThreshold if it becomes invalid after goal/duration changes
  useEffect(() => {
    if (Number(minThreshold || "0") < Number(autoThresholdStr)) {
      setMinThreshold(autoThresholdStr);
    }
  }, [autoThresholdStr]);

  async function handleCreate() {
    if (!wallet.connected) {
      toast.error(t.connectWalletFirst);
      return;
    }

    try {
      // 1. Preparar metadatos y validación en el servidor
      const prepared = await prepareProposalMetadata({
        title,
        description,
        recipient,
        goal,
        minThreshold,
        duration,
      }, wallet.address || "", "");

      // 2. Ejecutar transacción en la blockchain
      const result = await createMutation.mutateAsync({
        recipient: prepared.recipient,
        asset: { type: "native", symbol: "KAS", decimals: ctx?.chain === "kasplex-zkevm" ? 18 : DECIMALS.KAS },
        goal: prepared.goal,
        minThreshold: prepared.minThreshold,
        durationSeconds: prepared.durationSeconds,
        metadataURI: prepared.metadataURI,
      });

      if (result?.txId) {
        // 3. Registrar la propuesta pendiente en la DB (vía servidor)
        // Re-llamamos a la acción pero ahora con el txHash real para guardar en DB
        const saved = await prepareProposalMetadata({
          title,
          description,
          recipient,
          goal,
          minThreshold,
          duration,
        }, wallet.address || "", result.txId);

        toast.success(t.proposalCreated);
        router.push(`/proposal/${saved.tempId}`);
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

      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <ScrollReveal>
          <div className="mb-10 flex items-center justify-between">
            <div>
              <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-cyan-500">
                <ArrowLeft size={16} /> {t.backToHome}
              </Link>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{t.launchYourIdea}</h1>
              <p className="mt-2 text-muted-foreground">{t.launchYourIdeaDesc}</p>
            </div>
          </div>

          <div className="premium-glass rounded-[2.5rem] border-white/[0.05] p-1 shadow-2xl">
            <CreateProposalForm
              title={title}
              description={description}
              recipient={recipient}
              goal={goal}
              minThreshold={minThreshold}
              autoThreshold={autoThresholdStr}
              duration={duration}
              loading={createMutation.isPending}
              connected={wallet.connected}
              onTitleChange={setTitle}
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
