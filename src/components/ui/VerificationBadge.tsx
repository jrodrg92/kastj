import React from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationStatus = "verified" | "pending" | "mismatch" | "unsupported";

interface Props {
  status: VerificationStatus;
  className?: string;
}

export function VerificationBadge({ status, className }: Props) {
  const configs = {
    verified: {
      icon: ShieldCheck,
      text: "Verified on Chain",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    pending: {
      icon: ShieldQuestion,
      text: "Indexing State...",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    mismatch: {
      icon: ShieldX,
      text: "State Mismatch!",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    },
    unsupported: {
      icon: ShieldAlert,
      text: "Untrusted Node",
      color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all duration-500",
      config.color,
      className
    )}>
      <Icon size={12} className={cn(status === "pending" && "animate-pulse")} />
      {config.text}
    </div>
  );
}
