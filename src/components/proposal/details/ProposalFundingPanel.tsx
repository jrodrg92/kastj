"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ProposalFundingPanelProps {
  status: string;
  isExpired: boolean;
  isMutating: boolean;
  walletConnected: boolean;
  t: any;
  onFund: (amount: string) => void;
}

export function ProposalFundingPanel({
  status,
  isExpired,
  isMutating,
  walletConnected,
  t,
  onFund
}: ProposalFundingPanelProps) {
  const [amount, setAmount] = useState("");

  const handleFund = () => {
    if (!amount || isNaN(Number(amount))) return;
    onFund(amount);
    setAmount("");
  };

  if (status !== "active" || isExpired) return null;

  return (
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
      
      {!walletConnected && (
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Connect wallet to participate
        </p>
      )}
    </div>
  );
}
