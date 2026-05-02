import Link from "next/link";
import { NETWORK } from "../../lib/network";
import { formatRemainingTime, isExpired as hasExpired } from "../../lib/time";
import { useLanguage } from "../../contexts/LanguageContext";
import { InfoTooltip } from "../ui/InfoTooltip";
import { FeeSplit } from "../ui/FeeSplit";

type Proposal = {
  id: number;
  creator: string;
  recipient: string;
  goal: string;
  minThreshold: string;
  deadline: number;
  totalRaised: string;
  status: number;
  executed?: boolean;
  metadataURI?: string | null;
  asset?: { type: "native" } | { type: "krc20"; tokenAddress: `0x${string}` };
};

type Props = {
  proposal: Proposal;
  fundAmount: string;
  loading: boolean;
  connected: boolean;
  isSupported?: boolean;
  onFund: (id: number) => Promise<void>;
  onFinalize: (id: number) => Promise<void>;
  onWithdraw: (id: number) => Promise<void>;
};

import { useProposalMetadata } from "../../features/proposals/hooks/useProposalMetadata";
import { statusLabel, statusClass, short } from "../../lib/proposalUtils";

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
  const p = proposal;
  const metadata = useProposalMetadata(p.metadataURI);

  const percent =
    Number(p.goal) > 0
      ? Math.min((Number(p.totalRaised) / Number(p.goal)) * 100, 100)
      : 0;

  const thresholdPercent = 
    Number(p.goal) > 0
      ? Math.min((Number(p.minThreshold) / Number(p.goal)) * 100, 100)
      : 0;

  const isExpired = hasExpired(p.deadline);
  const isOverfunded = Number(p.totalRaised) > Number(p.goal);

  const canFund = connected && !loading && p.status === 0 && !isExpired;
  const canFinalize = connected && !loading && !p.executed && isExpired;
  const canWithdraw = connected && !loading && p.status === 2;

  return (
    <div className="group premium-glass relative flex flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* Decorative Glow on Hover */}
      <div className="pointer-events-none absolute -inset-px rounded-3xl border border-emerald-500/20 bg-emerald-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-screen"></div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">{metadata.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.proposalHash}{p.id} {isSupported && <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-400">{t.supportedBadge}</span>}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusClass(
              p.status
            )}`}
          >
            {statusLabel(p.status, t)}
          </span>
          
          <div className="flex flex-wrap gap-1 justify-end">
            {isExpired && (
              <span className="rounded-full border border-border bg-background/50 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {t.closableBadge}
              </span>
            )}
            {isOverfunded && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-500">
                {t.overfundedBadge}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{metadata.description}</p>

      <div className="mt-6 grid gap-2 rounded-2xl border border-border bg-background/50 p-4 text-xs text-muted-foreground md:grid-cols-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/70">{t.creator}:</span> 
          <span className="font-mono text-foreground/80">{short(p.creator)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/70">{t.receiver}:</span> 
          <span className="font-mono text-foreground/80">{short(p.recipient)}</span>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-foreground font-bold">{p.totalRaised}</span>
            <span className="text-[10px] text-muted-foreground">/ {p.goal}</span>
            <div className={`ml-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
              p.asset?.type === 'krc20' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {p.asset?.type === 'krc20' ? 'KRC20' : NETWORK.currency}
            </div>
          </div>
          <span className={percent >= thresholdPercent ? "text-emerald-500" : "text-amber-500"}>
            {percent.toFixed(1)}%
          </span>
        </div>

        <div className="relative h-2.5 overflow-hidden rounded-full bg-secondary ring-1 ring-inset ring-black/10 dark:ring-white/5">
          {/* Milestone Marker (Threshold) */}
          {thresholdPercent > 0 && thresholdPercent < 100 && (
            <div 
              className="absolute top-0 bottom-0 z-30 w-[3px] bg-white shadow-[0_0_15px_rgba(255,255,255,1)] dark:bg-white"
              style={{ left: `${thresholdPercent}%` }}
              title={`${t.minimum}: ${p.minThreshold} ${NETWORK.currency}`}
            ></div>
          )}
          
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              percent >= thresholdPercent 
                ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" 
                : "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        
        {thresholdPercent > 0 && (
          <div className="mt-1 flex justify-between text-[9px] uppercase tracking-tighter text-muted-foreground/60">
            <span>{t.start}</span>
            <span style={{ marginRight: `${100 - thresholdPercent}%` }}>{t.minimum}</span>
            <span>{t.goalLabel}</span>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-border/30 pt-4">
        <FeeSplit />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/proposal/${p.id}`}
          className="flex h-10 items-center justify-center rounded-xl border border-border bg-background/50 px-5 text-sm font-semibold text-foreground transition-all hover:bg-accent hover:text-accent-foreground backdrop-blur-sm"
        >
          {t.showDetail}
        </Link>

        {p.status === 0 && !isExpired && (
          <button
            disabled={!connected || loading}
            onClick={() => onFund(p.id)}
            className="flex h-10 items-center justify-center rounded-xl border border-border bg-background/50 px-5 text-sm font-medium text-foreground transition-all hover:bg-accent disabled:opacity-50"
          >
            {loading ? "..." : `${t.supp} ${fundAmount} ${NETWORK.currency}`}
          </button>
        )}

        {p.status === 0 && isExpired && (
          <button
            disabled={!connected || loading}
            onClick={() => onFinalize(p.id)}
            className="flex h-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {loading ? "..." : t.finalizeTrigger}
          </button>
        )}

        {p.status === 2 && isSupported && (
          <button
            disabled={!connected || loading}
            onClick={() => onWithdraw(p.id)}
            className="flex h-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/20 disabled:opacity-40"
          >
            {loading ? "..." : t.retFunds}
          </button>
        )}
      </div>
    </div>
  );
}