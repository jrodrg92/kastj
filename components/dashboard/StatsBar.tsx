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

  const raised = proposals.reduce(
    (acc, p) => acc + Number(p.totalRaised || 0),
    0
  );

  const items = [
    { label: "Total propuestas", value: total },
    { label: "Activas", value: active },
    { label: "Exitosas", value: succeeded },
    { label: "Fallidas", value: failed },
    { label: "Recaudado", value: `${raised.toFixed(2)} ETH` },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg"
        >
          <p className="text-sm text-zinc-400">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
        </div>
      ))}
    </section>
  );
}