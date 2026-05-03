"use client";

import { CheckCircle2, XCircle, Target, Coins, Loader2 } from "lucide-react";

interface ProposalLifecycleProps {
  status: string;
  isExpired: boolean;
  canFinalize: boolean;
  canWithdraw: boolean;
  isMutating: boolean;
  t: any;
  onFinalize: () => void;
  onWithdraw: () => void;
}

export function ProposalLifecycle({
  status,
  isExpired,
  canFinalize,
  canWithdraw,
  isMutating,
  t,
  onFinalize,
  onWithdraw
}: ProposalLifecycleProps) {
  return (
    <div className="space-y-4">
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

      {status === "succeeded" && (
        <div className="flex items-center gap-3 rounded-2xl bg-green-500/10 p-4 text-green-500 border border-green-500/20">
          <CheckCircle2 size={24} />
          <span className="font-medium">{t.proposalSucceeded || "Proposal Succeeded!"}</span>
        </div>
      )}

      {(status === "failed" || (isExpired && status === "active")) && !canWithdraw && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500 border border-red-500/20">
          <XCircle size={24} />
          <span className="font-medium">{t.proposalFailed || "Funding period ended"}</span>
        </div>
      )}
    </div>
  );
}
