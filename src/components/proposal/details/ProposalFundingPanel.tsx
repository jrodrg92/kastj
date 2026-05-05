"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ProposalFundingPanelProps {
  status: string;
  isExpired: boolean;
  isMutating: boolean;
  walletConnected: boolean;
  isVerified: boolean | null;
  trustState?: string;
  canFund?: boolean;
  t: any;
  onFund: (amount: string) => void;
}

export function ProposalFundingPanel({
  status,
  isExpired,
  isMutating,
  walletConnected,
  isVerified,
  trustState,
  canFund = true,
  t,
  onFund
}: ProposalFundingPanelProps) {
  const [amount, setAmount] = useState("");

  const isDisabled = isMutating || !amount || !walletConnected || !canFund;

  const handleFund = () => {
    if (isDisabled) return;
    onFund(amount);
    setAmount("");
  };

  if (status !== "active" || isExpired) return null;
  if (trustState === "mismatch") {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
          Security Alert: Data Mismatch
        </p>
        <p className="mt-1 text-[9px] text-muted-foreground leading-relaxed">
          The indexer data does not match the blockchain. Funding is disabled for your protection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={!canFund}
          className="w-full rounded-2xl border border-border bg-muted/50 px-5 py-4 text-xl font-bold text-foreground outline-none transition-all focus:border-cyan-500/50 focus:bg-muted disabled:opacity-50"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-border/30 px-3 py-1 text-xs font-bold text-muted-foreground">
          KAS
        </div>
      </div>

      <button
        onClick={handleFund}
        disabled={isDisabled}
        className="group relative w-full overflow-hidden rounded-2xl bg-cyan-600 py-4 font-bold text-white transition-all hover:bg-cyan-500 disabled:opacity-50 disabled:grayscale"
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
