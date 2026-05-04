import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Users, Loader2, ArrowRight } from "lucide-react";
import { NETWORK } from "../../lib/network";
import { formatRemainingTime, isExpired as hasExpired } from "../../lib/time";
import { useLanguage } from "../../contexts/LanguageContext";
import { ProposalView } from "@/core/proposal/proposal.types";
import { useProposalMetadata } from "../../features/proposals/hooks/useProposalMetadata";
import { short } from "../../lib/proposalUtils";

type Props = {
  proposal: ProposalView;
  fundAmount: string;
  loading: boolean;
  connected: boolean;
  isSupported?: boolean;
  onFund: (id: number) => Promise<void>;
  onFinalize: (id: number) => Promise<void>;
  onWithdraw: (id: number) => Promise<void>;
};

export function ProposalCard({
  proposal,
  fundAmount,
  loading,
  connected,
  isSupported,
  onFund,
  onFinalize,
  onWithdraw
}: Props) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const p = proposal;
  const metadata = useProposalMetadata(p.metadataURI);

  const goalRaw = BigInt(p.goal.raw);
  const raisedRaw = BigInt(p.totalRaised.raw);
  
  // Percentage helper
  const percentage = goalRaw > 0n 
    ? Math.min(Number((raisedRaw * 1000n) / goalRaw) / 10, 100)
    : 0;

  const isExpired = hasExpired(p.deadline);
  
  // Status Logic
  let statusKey = "Active";
  let statusColor = "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
  
  if (raisedRaw >= goalRaw) {
    statusKey = "Funded";
    statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  } else if (isExpired) {
    statusKey = isSupported ? "Refundable" : "Expired";
    statusColor = isSupported 
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
      : "bg-rose-500/10 text-rose-500 border-rose-500/20";
  }

  // Formatting percentage
  const formattedPercent = percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1);

  return (
    <Link 
      href={`/proposal/${p.id}`}
      className="group relative flex items-center gap-5 overflow-hidden rounded-[2.5rem] border border-border/50 bg-card p-5 transition-all duration-300 hover:border-cyan-500/40 hover:bg-muted/10 hover:shadow-2xl dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
      {/* Juicebox-style Icon */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-3xl border border-border/50 bg-muted shadow-sm">
        {metadata.image || metadata.coverImage ? (
          <img 
            src={metadata.image || metadata.coverImage} 
            alt={metadata.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
             <span className="text-[8px] font-black uppercase tracking-tighter text-cyan-500/40 text-center px-1">KASTJ</span>
          </div>
        )}
      </div>

      {/* Info Column */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <h3 className="truncate text-base font-black tracking-tight text-foreground transition-colors group-hover:text-cyan-500">
          {metadata.title}
        </h3>
        
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-foreground">
              {p.totalRaised.value}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/40">
              / {p.goal.value} KAS
            </span>
          </div>
          {percentage > 0 && (
            <span className="text-[10px] font-black text-cyan-500">
              +{formattedPercent}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/40 border border-border/5">
          {/* Success Threshold Marker */}
          <div 
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-card bg-cyan-500/30 z-10"
            style={{ left: `${Math.min((Number(BigInt(p.minThreshold.raw) * 1000n / goalRaw) / 10), 100)}%` }}
          />
          
          <div 
            className={`h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(6,182,212,0.4)] ${percentage >= 100 ? "bg-emerald-500" : "bg-cyan-500"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-1 flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
            <Clock size={10} className="text-cyan-500/60" />
            {mounted ? formatRemainingTime(p.deadline) : "--"}
          </div>
          
          <div className={`rounded-full px-2 text-[8px] font-black uppercase tracking-widest ${statusColor.split(' ')[1]}`}>
             {statusKey}
          </div>
        </div>
      </div>

      {/* Hover Arrow Indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
        <ArrowRight size={16} className="text-cyan-500" />
      </div>
    </Link>
  );
}