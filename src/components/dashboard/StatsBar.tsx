import { BarChart3, Activity, CheckCircle2, XCircle, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";

import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "../../features/proposals/queryKeys";
import { fetchStats } from "../../features/proposals/api";

type StatItem = {
  label: string;
  value: string | number;
  micro?: string;
  icon: LucideIcon;
};

export function StatsBar() {
  const { t } = useLanguage();
  const { data: stats } = useQuery({
    queryKey: [...proposalKeys.all, "stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
  });

  if (!stats) return null;

  const items: StatItem[] = [
    {
      label: t.total,
      value: stats.total,
      micro: "All time",
      icon: BarChart3,
    },
    {
      label: t.activeStatus,
      value: stats.active,
      micro: "Open now",
      icon: Activity,
    },
    {
      label: t.succeededStatus,
      value: stats.succeeded,
      micro: "Funds unlocked",
      icon: CheckCircle2,
    },
    {
      label: t.failedStatus,
      value: stats.failed,
      micro: "Refunded",
      icon: XCircle,
    },
    {
      label: t.recud,
      value: `${stats.raised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      micro: NETWORK.currency,
      icon: Coins,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="group premium-glass rounded-2xl p-5 transition-all duration-300 hover:border-cyan-500/15 hover:shadow-[0_0_24px_rgba(6,182,212,0.04)]"
          >
            <div className="flex items-center gap-2">
              <Icon size={13} className="text-cyan-500/50 transition-colors group-hover:text-cyan-500/80" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{item.label}</p>
            </div>
            <p className="mt-2.5 text-2xl font-bold tracking-tight text-foreground">
              {item.value}
            </p>
            {item.micro && (
              <p className="mt-1 text-[10px] text-muted-foreground/40">{item.micro}</p>
            )}
          </div>
        );
      })}
    </section>
  );
}