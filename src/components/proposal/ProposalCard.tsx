import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Users, Loader2 } from "lucide-react";
import { NETWORK } from "../../lib/network";
import { formatRemainingTime, isExpired as hasExpired } from "../../lib/time";
import { useLanguage } from "../../contexts/LanguageContext";
import { InfoTooltip } from "../ui/InfoTooltip";
import { FeeSplit } from "../ui/FeeSplit";

import { ProposalView } from "@/core/proposal/proposal.types";

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

import { useProposalMetadata } from "../../features/proposals/hooks/useProposalMetadata";
import { statusLabel, short } from "../../lib/proposalUtils";

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
  const thresholdRaw = BigInt(p.minThreshold.raw);

  const percent =
    goalRaw > 0n
      ? Number((raisedRaw * 100n) / goalRaw)
      : 0;

  const thresholdPercent =
    goalRaw > 0n
      ? Number((thresholdRaw * 100n) / goalRaw)
      : 0;

  const isExpired = hasExpired(p.deadline);

  const canFund = connected && !loading && p.status === "active" && !isExpired;
  const canFinalize = connected && !loading && isExpired;
  const canWithdraw = connected && !loading && p.status === "failed" && isSupported;

  /* Status badge styling - adding the dot and glow */
  const statusConfig =
    p.status === "active"
      ? { label: statusLabel(p.status, t), color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", dot: "bg-amber-400" }
      : p.status === "succeeded"
        ? { label: statusLabel(p.status, t), color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" }
        : { label: statusLabel(p.status, t), color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-400" };

  return (
    <div className={`group relative flex h-full flex-col rounded-[2.5rem] border border-white/[0.05] bg-gradient-to-b from-card/60 to-card/20 p-6 backdrop-blur-xl transition-all duration-500 hover:border-cyan-500/40 hover:shadow-[0_32px_80px_rgba(0,0,0,0.6)] ${p.status === 'active' ? 'animate-shimmer' : ''}`}>
      {/* Dynamic glow effect */}
      <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px] transition-opacity duration-700 group-hover:opacity-100 opacity-0" />

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-cyan-400">
            {metadata.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">#{p.id}</span>
            {isSupported && (
              <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-cyan-400 border border-cyan-500/20">
                {t.supportedBadge}
              </span>
            )}
          </div>
        </div>
        
        <div className={`flex items-center gap-2 rounded-full border ${statusConfig.border} ${statusConfig.bg} px-3 py-1 transition-all group-hover:scale-105`}>
           <div className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot} shadow-[0_0_8px_currentColor]`} />
           <span className={`text-[9px] font-black uppercase tracking-widest ${statusConfig.color}`}>
             {statusConfig.label}
           </span>
        </div>
      </div>

      {/* ─── Description ─── */}
      <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground/60 font-medium">
        {metadata.description}
      </p>

      {/* ─── Identity (Single Line) ─── */}
      <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 transition-all duration-300 group-hover:bg-white/[0.06] group-hover:border-white/10">
        <div className="flex flex-col">
          <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Creator</span>
          <span className="font-mono text-[9px] font-bold text-foreground/70">{short(p.creator)}</span>
        </div>
        <div className="h-4 w-[1px] bg-white/[0.05]" />
        <div className="flex flex-col text-right">
          <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Recipient</span>
          <span className="font-mono text-[9px] font-bold text-foreground/70">{short(p.recipient)}</span>
        </div>
      </div>

      {/* ─── Progress ─── */}
      <div className="mt-6 space-y-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">{t.raisedLabel}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tighter text-foreground group-hover:text-cyan-400 transition-colors">{p.totalRaised.value}</span>
              <span className="text-[10px] font-bold text-muted-foreground/30">/ {p.goal.value} {NETWORK.currency}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-sm font-black tracking-tighter transition-all group-hover:scale-110 ${percent >= thresholdPercent ? "text-cyan-400" : "text-amber-400"}`}>
              {percent.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.04] shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              percent >= thresholdPercent
                ? "bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ─── Metadata Footer ─── */}
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-5">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
            <Clock size={12} className="text-cyan-500/50" />
            <span className="text-foreground/70">{mounted ? formatRemainingTime(p.deadline) : "--"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
            <Users size={12} className="text-cyan-500/50" />
            <span className="text-foreground/70">{percent.toFixed(0)}% Cap</span>
          </div>
        </div>

        {/* ─── Actions ─── */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href={`/proposal/${p.id}`}
            className="premium-btn flex h-11 items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            {t.showDetail}
          </Link>

          {p.status === "active" && !isExpired && (
            <button
              disabled={!connected || loading}
              onClick={() => onFund(p.id)}
              className="group/btn relative flex h-11 items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-white/[0.05] hover:border-white/20 active:scale-95 disabled:opacity-40"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
              {loading ? <Loader2 size={14} className="animate-spin" /> : `${t.supp} ${fundAmount}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}