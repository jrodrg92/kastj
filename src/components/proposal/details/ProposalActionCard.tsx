"use client";

import { useState } from "react";
import { Coins, Target, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { parseUnits } from "@/lib/currencyUtils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface ProposalActionCardProps {
  proposal: any;
  fundings: any[];
  isExpired: boolean;
  canFinalize: boolean;
  canWithdraw: boolean;
  isMutating: boolean;
  walletConnected: boolean;
  t: any;
  onFund: (amount: string) => void;
  onFinalize: () => void;
  onWithdraw: () => void;
  onVerify: () => void;
  isVerifying: boolean;
  isVerified: boolean | null;
}

export function ProposalActionCard({
  proposal,
  fundings,
  isExpired,
  canFinalize,
  canWithdraw,
  isMutating,
  walletConnected,
  t,
  onFund,
  onFinalize,
  onWithdraw
}: ProposalActionCardProps) {
  const [amount, setAmount] = useState("");

  // Cálculo de progreso en caliente basado en fundings (más reactivo que la DB)
  const realTimeRaised = fundings.reduce((sum, f) => sum + BigInt(f.amount), 0n);
  const goalRaw = BigInt(proposal.goalRaw || 0);
  const progress = goalRaw > 0n ? Number((realTimeRaised * 10000n) / goalRaw) / 100 : 0;
  
  const handleFund = () => {
    if (!amount || isNaN(Number(amount))) return;
    onFund(amount);
    setAmount("");
  };

  return (
    <div className="premium-glass sticky top-24 flex flex-col gap-6 rounded-[2.5rem] border-white/[0.05] p-8 shadow-2xl">
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{t.totalRaised || "Total Raised"}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{proposal.totalRaised || "0"}</span>
            <span className="text-sm font-medium text-cyan-500">KAS</span>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{t.goal || "Goal"}</p>
          <p className="text-xl font-semibold text-white">{proposal.goal} KAS</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/5">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span className="text-cyan-500">{progress.toFixed(2)}%</span>
          <span className="text-muted-foreground">{fundings.length} {t.contributors || "contributors"}</span>
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-2 space-y-4">
        {proposal.status === "active" && !isExpired && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xl font-bold text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-muted-foreground">
                KAS
              </div>
            </div>

            <button
              onClick={handleFund}
              disabled={isMutating || !amount || !walletConnected}
              className="group relative w-full overflow-hidden rounded-2xl bg-cyan-600 py-4 font-bold text-white transition-all hover:bg-cyan-500 disabled:opacity-50"
            >
              {isMutating ? <Loader2 className="mx-auto animate-spin" /> : t.supportThisProject || "Support Project"}
            </button>
          </div>
        )}

        {canFinalize && (
          <button
            onClick={onFinalize}
            disabled={isMutating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-bold text-white transition-all hover:bg-white/20"
          >
            {isMutating ? <Loader2 className="animate-spin" /> : <Target size={20} />}
            {t.finalizeProposal || "Finalize Proposal"}
          </button>
        )}

        {canWithdraw && (
          <button
            onClick={onWithdraw}
            disabled={isMutating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500/10 py-4 font-bold text-amber-500 transition-all hover:bg-amber-500/20"
          >
            {isMutating ? <Loader2 className="animate-spin" /> : <Coins size={20} />}
            {t.withdrawFunds || "Withdraw My Funds"}
          </button>
        )}

        {/* Status Messages */}
        {proposal.status === "succeeded" && (
          <div className="flex items-center gap-3 rounded-2xl bg-green-500/10 p-4 text-green-500">
            <CheckCircle2 size={24} />
            <span className="font-medium">{t.proposalSucceeded || "Proposal Succeeded!"}</span>
          </div>
        )}
        {(proposal.status === "failed" || (isExpired && proposal.status === "active")) && !canWithdraw && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500">
            <XCircle size={24} />
            <span className="font-medium">{t.proposalFailed || "Funding period ended"}</span>
          </div>
        )}

        {/* Verification Area */}
        <div className="mt-4 pt-4 border-t border-white/5">
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
        </div>
      </div>

      {/* Info Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Minimum Threshold</p>
          <p className="text-sm font-semibold text-white">{proposal.minThreshold} KAS</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
          <p className="text-sm font-semibold text-white">
            {new Date(proposal.deadline * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
