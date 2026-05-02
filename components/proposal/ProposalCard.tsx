import Link from "next/link";
import { NETWORK } from "../../lib/network";
import { formatRemainingTime, isExpired as hasExpired } from "../../lib/time";
import { useLanguage } from "../../contexts/LanguageContext";

type Proposal = {
  id: number;
  creator: string;
  recipient: string;
  goal: string;
  deadline: number;
  totalRaised: string;
  status: number;
  executed?: boolean;
  metadataURI?: string | null;
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

function short(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function statusLabel(status: number) {
  if (status === 0) return "Activa";
  if (status === 1) return "Exitosa";
  if (status === 2) return "Fallida";
  return "Desconocida";
}

function statusClass(status: number) {
  if (status === 0) return "border border-amber-500/30 bg-amber-500/10 text-amber-400";
  if (status === 1) return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
  if (status === 2) return "border border-red-500/30 bg-red-500/10 text-red-400";
  return "border border-zinc-500/30 bg-zinc-500/10 text-zinc-400";
}

function parseMetadata(uri?: string) {
  if (!uri?.startsWith("local://")) {
    return {
      title: "Propuesta sin título",
      description: "Sin descripción disponible.",
    };
  }

  try {
    return JSON.parse(decodeURIComponent(uri.replace("local://", "")));
  } catch {
    return {
      title: "Error metadata",
      description: "No se pudo leer la metadata.",
    };
  }
}

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
  const p = proposal;
  const metadata = parseMetadata(p.metadataURI ?? undefined);

  const percent =
    Number(p.goal) > 0
      ? Math.min((Number(p.totalRaised) / Number(p.goal)) * 100, 100)
      : 0;

  const isExpired = hasExpired(p.deadline);
  const isOverfunded = Number(p.totalRaised) > Number(p.goal);

  const canFund = connected && !loading && p.status === 0 && !isExpired;
  const canFinalize = connected && !loading && !p.executed && isExpired;
  const canWithdraw = connected && !loading && p.status === 2;

  const { t } = useLanguage();

  return (
    <div className="group premium-glass relative flex flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* Decorative Glow on Hover */}
      <div className="pointer-events-none absolute -inset-px rounded-3xl border border-emerald-500/20 bg-emerald-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-screen"></div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">{metadata.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Propuesta #{p.id} {isSupported && <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-400">Apoyada</span>}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusClass(
            p.status
          )}`}
        >
          {statusLabel(p.status)}
        </span>
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
          <span className="text-foreground/80">
            {p.totalRaised} / <span className="text-muted-foreground">{p.goal} {NETWORK.currency}</span>
          </span>
          <span className="text-emerald-500">{percent.toFixed(1)}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-secondary ring-1 ring-inset ring-black/10 dark:ring-white/5">
          <div
            className="h-full rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all duration-1000 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full border border-border bg-background/50 px-2.5 py-1">
          {isExpired ? "Finalizable" : formatRemainingTime(p.deadline)}
        </span>

        {isOverfunded && (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
            🔥 Overfunded
          </span>
        )}

        <span className="rounded-full border border-border bg-background/50 px-2.5 py-1">
          93% / 5% / 2%
        </span>
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
            {loading ? "..." : "Finalizar (Trigger)"}
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