"use client";

import { useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [contributorComplianceAccepted, setContributorComplianceAccepted] = useState(false);

  const isDisabled = isMutating || !amount || !walletConnected || !canFund || !contributorComplianceAccepted;

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

      {/* Contributor Compliance Checkbox */}
      <div 
        onClick={() => setContributorComplianceAccepted(!contributorComplianceAccepted)}
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group",
          contributorComplianceAccepted 
            ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
            : "border-border bg-muted/30 hover:border-muted-foreground/20"
        )}
      >
         <div className={cn(
           "h-4 w-4 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
           contributorComplianceAccepted ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
         )}>
            {contributorComplianceAccepted && <Check size={10} strokeWidth={4} />}
         </div>
         <p className={cn(
           "text-[9px] font-bold leading-relaxed transition-colors",
           contributorComplianceAccepted ? "text-foreground" : "text-muted-foreground"
         )}>
           {t.complianceContributorCheckbox}
         </p>
      </div>

      <button
        onClick={handleFund}
        disabled={isDisabled}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl py-4 font-bold text-white transition-all",
          !isDisabled 
            ? "bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/20" 
            : "bg-muted text-muted-foreground grayscale cursor-not-allowed"
        )}
      >
        {isMutating ? <Loader2 className="mx-auto animate-spin" /> : t.supp || "Support"}
      </button>
      
      {!walletConnected && (
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          {t.connectWalletFirst}
        </p>
      )}
    </div>
  );
}
