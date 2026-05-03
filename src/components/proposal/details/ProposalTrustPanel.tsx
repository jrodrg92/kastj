"use client";

import { ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";

import { VerificationResult } from "@/engines/proposal-engine.interface";

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
  return (
    <div className="premium-glass relative overflow-hidden rounded-3xl border-white/5 p-6 space-y-4">
      {isVerified === true && (
        <div className="absolute inset-0 pointer-events-none bg-emerald-500/[0.03] animate-pulse" />
      )}
      
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
          isVerified === true ? "bg-emerald-500/20 text-emerald-500" : "bg-cyan-500/10 text-cyan-500"
        }`}>
          <ShieldCheck size={20} className={isVerified === true ? "animate-bounce" : ""} />
        </div>
        <div>
          <h3 className="font-bold text-white tracking-tight">{t.trustTitle || "Trust & Security"}</h3>
          <p className="text-[10px] text-muted-foreground leading-tight">{t.trustDesc || "Verify data directly from the blockchain source of truth."}</p>
        </div>
      </div>

      <button
        onClick={onVerify}
        disabled={isVerifying}
        className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
          isVerified === true 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
          : "border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
        }`}
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        
        {isVerifying ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isVerified === true ? (
          <CheckCircle2 size={14} />
        ) : (
          <ShieldCheck size={14} className="text-cyan-500" />
        )}
        {isVerified === true ? (t.verifiedOnChain || "Verified On-Chain") : (t.verifyOnChain || "Verify On-Chain")}
      </button>

      {isVerified === true && result?.status === "verified" && (
        <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-4" />
          {result.checks.map((check, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-emerald-500/80 font-bold">
              <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_5px_currentColor]" />
              <span>{check}</span>
            </div>
          ))}
          <p className="text-[9px] font-mono text-muted-foreground/30 text-center pt-3 uppercase tracking-tighter">
            Verified: {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {isVerified === false && result?.status === "failed" && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <ShieldCheck size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Integrity Alert</p>
          </div>
          <p className="text-[10px] text-rose-400/90 leading-relaxed font-medium">{result.reason}</p>
        </div>
      )}
    </div>
  );
}
