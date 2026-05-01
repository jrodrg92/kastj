import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";

export function UserDashboard({
  dashboard,
  loading,
}: {
  dashboard: {
    totalContributed: string;
    activeContributed: string;
    withdrawable: string;
    createdCount: number;
    supportedCount: number;
  };
  loading: boolean;
}) {
  const {t} = useLanguage();

  const cards = [
    {
      label: t.totCont,
      value: `${Number(dashboard.totalContributed).toFixed(4)} ${NETWORK.currency}`,
    },
    {
      label: t.crrnlyUnclck,
      value: `${Number(dashboard.activeContributed).toFixed(4)} ${NETWORK.currency}`,
    },
    {
      label: t.withdrw,
      value: `${Number(dashboard.withdrawable).toFixed(4)} ${NETWORK.currency}`,
    },
    {
      label: t.crtdByMe,
      value: dashboard.createdCount,
    },
    {
      label: t.suprtd,
      value: dashboard.supportedCount,
    },
  ];

  {Number(dashboard.withdrawable) > 0 && (
  <div className="mt-6">
    <button
      onClick={onWithdrawAll}
      className="w-full rounded-2xl bg-red-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-red-400"
    >
      Withdraw {Number(dashboard.withdrawable).toFixed(4)} {NETWORK.currency}
    </button>
  </div>
)}

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.mydsbrd}</h2>
          <p className="text-sm text-zinc-400">
            {t.actApp}
          </p>
        </div>

        {loading && (
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400">
            {t.updating}
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <p className="text-sm text-zinc-400">{card.label}</p>
            <p className="mt-2 text-2xl font-black">{card.value}</p>
          </div>
        ))}
        {Number(dashboard.withdrawable) > 0 && (
          <div className="mt-6">
            <button
              onClick={onWithdrawAll}
              className="w-full rounded-2xl bg-red-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-red-400"
            >
              Withdraw {Number(dashboard.withdrawable).toFixed(4)} {NETWORK.currency}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}