import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";

type Proposal = {
  id: number;
  goal: string;
  totalRaised: string;
  status: number;
};

export function StatsBar({ proposals }: { proposals: Proposal[] }) {
  const total = proposals.length;
  const active = proposals.filter((p) => p.status === 0).length;
  const succeeded = proposals.filter((p) => p.status === 1).length;
  const failed = proposals.filter((p) => p.status === 2).length;
  const { t } = useLanguage();

  const raised = proposals.reduce(
    (acc, p) => acc + Number(p.totalRaised || 0),
    0
  );

  const items = [
    { label: t.total, value: total },
    { label: t.active, value: active },
    { label: t.succeeded, value: succeeded },
    { label: t.failed, value: failed },
    { label: t.recud, value: `${raised.toFixed(2)} ${NETWORK.currency}` },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-card/80"
        >
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{item.value}</p>
        </div>
      ))}
    </section>
  );
}