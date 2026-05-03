"use client";

import { ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";

interface ProposalTrustPanelProps {
  onVerify: () => void;
  isVerifying: boolean;
  isVerified: boolean | null;
  t: any;
}

export function ProposalTrustPanel({
  onVerify,
  isVerifying,
  isVerified,
  t
}: ProposalTrustPanelProps) {
  return (
    <div className="premium-glass rounded-3xl border-white/5 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h3 className="font-bold text-white">{t.trustTitle || "Trust & Security"}</h3>
          <p className="text-xs text-muted-foreground">{t.trustDesc || "Verify data directly from the blockchain."}</p>
        </div>
      </div>

      <button
        onClick={onVerify}
        disabled={isVerifying}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold transition-all ${
          isVerified === true 
          ? "bg-green-500/10 border-green-500/30 text-green-500" 
          : "border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
        }`}
      >
        {isVerifying ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isVerified === true ? (
          <CheckCircle2 size={14} />
        ) : (
          <ShieldCheck size={14} className="text-cyan-500" />
        )}
        {isVerified === true ? (t.verifiedOnChain || "Verified On-Chain") : (t.verifyOnChain || "Verify On-Chain")}
      </button>

      {isVerified === true && (
        <p className="text-[10px] text-center text-green-500/80 font-medium">
          Matches live contract state
        </p>
      )}
    </div>
  );
}
