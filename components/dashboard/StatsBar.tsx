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