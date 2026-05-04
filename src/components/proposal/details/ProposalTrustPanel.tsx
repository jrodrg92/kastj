"use client";

import { ShieldCheck, ShieldX, CheckCircle2, Loader2, Info } from "lucide-react";
import { VerificationResult } from "@/engines/proposal-engine.interface";
import { VerificationBadge, VerificationStatus } from "@/components/ui/VerificationBadge";

interface ProposalTrustPanelProps {
  onVerify: () => void;
  isVerifying: boolean;
  isVerified: boolean | null;
  result: VerificationResult | null;
  t: any;
}

export function ProposalTrustPanel({
  onVerify,
  isVerifying,
  isVerified,
  result,
  t
}: ProposalTrustPanelProps) {
  
  let badgeStatus: VerificationStatus = "pending";
  if (isVerified === true) badgeStatus = "verified";
  if (isVerified === false) badgeStatus = "mismatch";

  return (
    <div className="premium-glass relative overflow-hidden rounded-[2.5rem] border-white/5 p-8 space-y-6">
      {isVerified === true && (
        <div className="absolute inset-0 pointer-events-none bg-emerald-500/[0.02] animate-pulse" />
      )}
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white tracking-tight">{t.trustTitle || "Trust Engine"}</h3>
          <p className="text-[10px] text-muted-foreground leading-tight uppercase font-bold tracking-widest">
            {t.trustDesc || "Direct blockchain verification"}
          </p>
        </div>
        <VerificationBadge status={badgeStatus} />
      </div>

      <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
        <div className="flex items-start gap-3">
           <Info size={16} className="text-cyan-500 mt-0.5 shrink-0" />
           <p className="text-[10px] text-zinc-400 leading-relaxed">
             Kastj indexes data for performance, but the source of truth is always the blockchain. 
             Use the Verify button to perform a cross-check between our indexer and the chain state.
           </p>
        </div>
      </div>

      <button
        onClick={onVerify}
        disabled={isVerifying}
        className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border h-14 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
          isVerified === true 
          ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
          : isVerified === false
          ? "bg-rose-500 text-white border-rose-400"
          : "bg-white/5 border-white/10 text-white hover:bg-white/10"
        }`}
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        
        {isVerifying ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isVerified === true ? (
          <CheckCircle2 size={16} />
        ) : (
          <ShieldCheck size={16} />
        )}
        {isVerified === true ? (t.verifiedOnChain || "Verified On-Chain") : (t.verifyOnChain || "Start Verification")}
      </button>

      {isVerified === true && result?.status === "verified" && (
        <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="h-px bg-white/5 mb-4" />
          {result.checks.map((check, i) => (
            <div key={i} className="flex items-center gap-3 text-[10px] text-emerald-400 font-bold">
              <CheckCircle2 size={12} className="shrink-0" />
              <span>{check}</span>
            </div>
          ))}
          <div className="pt-4 text-center">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
              Proof Timestamp: {new Date(result.timestamp).toISOString()}
            </span>
          </div>
        </div>
      )}

      {isVerified === false && result?.status === "failed" && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 text-rose-500 mb-3">
            <ShieldX size={18} />
            <p className="text-[11px] font-black uppercase tracking-widest">Integrity Violation</p>
          </div>
          <p className="text-[10px] text-rose-400/90 leading-relaxed font-bold">{result.reason}</p>
          <p className="mt-4 text-[9px] text-rose-300/50 italic">
            This proposal state does not match the blockchain truth. For your safety, interactions have been restricted.
          </p>
        </div>
      )}
    </div>
  );
}
