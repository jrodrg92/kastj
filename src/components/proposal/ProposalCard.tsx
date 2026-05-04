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
      className="group flex flex-col h-full overflow-hidden rounded-[2rem] border border-border bg-card transition-all duration-300 hover:border-cyan-500/30 hover:shadow-xl dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      {/* Cover Image */}
      <div className="aspect-[21/9] w-full overflow-hidden bg-muted">
        {metadata.image || metadata.coverImage ? (
          <img 
            src={metadata.image || metadata.coverImage} 
            alt={metadata.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">KASTJ Proposal</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="line-clamp-1 text-lg font-black tracking-tight text-foreground transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
            {metadata.title}
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground/40">#{p.id}</span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground/70 leading-relaxed mb-6">
          {metadata.summary || metadata.description}
        </p>

        <div className="mt-auto space-y-4">
          {/* Progress Stats */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-foreground">{p.totalRaised.value}</span>
                <span className="text-[10px] font-bold text-muted-foreground/40">/ {p.goal.value} KAS</span>
              </div>
              <span className="text-sm font-black text-cyan-500">{formattedPercent}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${percentage >= 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]"}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              <Clock size={12} className="text-cyan-500" />
              {mounted ? formatRemainingTime(p.deadline) : "--"}
            </div>
            
            <div className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
               {statusKey}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}