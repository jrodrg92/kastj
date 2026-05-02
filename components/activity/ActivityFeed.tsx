import { useState } from "react";
import Link from "next/link";
import { NETWORK } from "../../lib/network";
import { formatActivityAmount } from "../../hooks/useActivityFeed";

function short(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function icon(type: string) {
  if (type === "created") return "🆕";
  if (type === "funded") return "💸";
  if (type === "succeeded") return "✅";
  if (type === "failed") return "❌";
  return "•";
}

export function ActivityFeed({
  activity,
  loading,
}: {
  activity: any[];
  loading: boolean;
}) {

  const [collapsed, setCollapsed] = useState(false);


  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
       <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex justify-between items-center p-6"
      >
        <span className="font-semibold">Actividad reciente</span>
        <span>{collapsed ? 
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg> : 
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${
        collapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100 p-6 pt-0"
      }`}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Actividad reciente</h2>
            <p className="text-sm text-zinc-400">
              Eventos indexados desde contratos.
            </p>
          </div>
        </div>

        {loading && (
          <p className="text-zinc-400">Cargando actividad...</p>
        )}

        {!loading && activity.length === 0 && (
          <p className="text-zinc-400">Todavía no hay actividad.</p>
        )}

        <div className="space-y-3">
          {activity.map((item) => {
            const amount = formatActivityAmount(item.amount);

            return (
              <Link
                key={item.id}
                href={`/proposal/${item.proposal_id}`}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700 hover:bg-zinc-800 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{icon(item.type)}</span>

                  <div>
                    <p className="font-semibold">{item.message}</p>

                    <p className="text-sm text-zinc-400">
                      {item.actor ? short(item.actor) : "Sistema"} ·{" "}
                      {new Date(Number(item.created_at)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {amount && (
                  <p className="font-bold text-green-400">
                    {amount} {NETWORK.currency}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

    </section>
  );
}