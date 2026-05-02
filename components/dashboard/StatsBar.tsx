import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";

type Proposal = {
  id: number;
  goal: string;
  totalRaised: string;
  status: number;
};

import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "../../features/proposals/queryKeys";
import { fetchStats } from "../../features/proposals/api";

export function StatsBar() {
  const { t } = useLanguage();
  const { data: stats } = useQuery({
    queryKey: [...proposalKeys.all, "stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
  });

  if (!stats) return null;

  const items = [
    { label: t.total, value: stats.total },
    { label: t.activeStatus, value: stats.active },
    { label: t.succeededStatus, value: stats.succeeded },
    { label: t.failedStatus, value: stats.failed },
    { label: t.recud, value: `${stats.raised.toFixed(2)} ${NETWORK.currency}` },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="premium-glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-gradient">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}