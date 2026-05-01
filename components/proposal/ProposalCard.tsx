import Link from "next/link";
import { NETWORK } from "../../lib/network";
import { formatRemainingTime, isExpired as hasExpired } from "../../lib/time";
import { useLang } from "../../hooks/useLang";

type Proposal = {
  id: number;
  creator: string;
  recipient: string;
  goal: string;
  deadline: number;
  totalRaised: string;
  status: number;
  executed: boolean;
  metadataURI?: string;
};

type Props = {
  proposal: Proposal;
  fundAmount: string;
  loading: boolean;
  connected: boolean;
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
  if (status === 0) return "bg-yellow-500 text-black";
  if (status === 1) return "bg-green-500 text-black";
  if (status === 2) return "bg-red-500 text-white";
  return "bg-zinc-700 text-white";
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
  onFund,
  onFinalize,
  onWithdraw,
}: Props) {
  const p = proposal;
  const metadata = parseMetadata(p.metadataURI);

  const percent =
    Number(p.goal) > 0
      ? Math.min((Number(p.totalRaised) / Number(p.goal)) * 100, 100)
      : 0;

  const isExpired = hasExpired(p.deadline);
  const isOverfunded = Number(p.totalRaised) > Number(p.goal);

  const canFund = connected && !loading && p.status === 0 && !isExpired;
  const canFinalize = connected && !loading && !p.executed && isExpired;
  const canWithdraw = connected && !loading && p.status === 2;

  const {t} = useLang();

  return (

    <article className="group rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl transition hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Propuesta #{p.id}</p>
          <h3 className="mt-1 text-2xl font-bold">{metadata.title}</h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${statusClass(
            p.status
          )}`}
        >
          {statusLabel(p.status)}
        </span>
      </div>

      <p className="mt-3 text-sm text-zinc-400">{metadata.description}</p>

      <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400 md:grid-cols-2">
        <p>
          {t.creator}: <span className="text-white">{short(p.creator)}</span>
        </p>
        <p>
          {t.receiver}: <span className="text-white">{short(p.recipient)}</span>
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">
            {p.totalRaised} / {p.goal} {NETWORK.currency}
          </span>
          <span className="text-zinc-400">{percent.toFixed(1)}%</span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-4 rounded-full bg-green-500 transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">
          {isExpired ? "Finalizable" : formatRemainingTime(p.deadline)}
        </span>

        {isOverfunded && (
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-green-400">
            🔥 Overfunded
          </span>
        )}

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">
          93% / 5% / 2%
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/proposal/${p.id}`}
          className="rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
        >
          {t.showDetail}
        </Link>

        <button
          disabled={!canFund}
          onClick={() => onFund(p.id)}
          className="rounded-xl bg-blue-500 px-5 py-3 font-bold text-black transition hover:bg-blue-400 disabled:opacity-40"
        >
          {loading ? "Procesando..." :  ` ${t.supp} ${fundAmount} ${NETWORK.currency}`}
        </button>

        <button
          disabled={!canFinalize}
          onClick={() => onFinalize(p.id)}
          className="rounded-xl bg-yellow-500 px-5 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:opacity-40">
          {isExpired ? t.end : formatRemainingTime(p.deadline)}
        </button>

        {p.status === 2 && (
          <button
            disabled={!canWithdraw}
            onClick={() => onWithdraw(p.id)}
            className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-400 disabled:opacity-40"
          >
            {t.retFunds}
          </button>
        )}
      </div>
    </article>

  );
}