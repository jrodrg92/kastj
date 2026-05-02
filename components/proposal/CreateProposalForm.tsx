import toast from "react-hot-toast";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";

type Props = {
  title: string;
  description: string;
  recipient: string;
  goal: string;
  minThreshold: string;
  autoThreshold: string;
  duration: string;
  loading: boolean;
  connected: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRecipientChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onMinThresholdChange: (value: string) => void;
  onDurationChange?: (value: string) => void;
  onCreate: () => Promise<void>;
};

export function CreateProposalForm({
  title,
  description,
  recipient,
  goal,
  minThreshold,
  autoThreshold,
  duration,
  loading,
  connected,
  onTitleChange,
  onDescriptionChange,
  onRecipientChange,
  onGoalChange,
  onMinThresholdChange,
  onDurationChange,
  onCreate,
}: Props) {
  const { t } = useLanguage();

  const durationOptions = [
    { label: t.min5, value: "300" },
    { label: t.hour1, value: "3600" },
    { label: t.day1, value: "86400" },
    { label: t.days7, value: "604800" },
    { label: t.days30, value: "2592000" },
  ];

  async function handleSubmit() {
    if (!connected) {
      toast.error(t.connectWalletFirst);
      return;
    }

    await onCreate();
  }

  return (
    <section className="premium-glass rounded-3xl p-8 lg:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.createProposal}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.defdata}
          </p>
        </div>

        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-500">
          {NETWORK.name}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground/90">
            {t.title}
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-background/50 p-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
            placeholder={t.ej1}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground/90">
            {t.description}
          </label>
          <textarea
            className="min-h-[140px] w-full resize-y rounded-xl border border-border bg-background/50 p-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
            placeholder={t.ej2}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground/90">
            {t.walletreceiver}
          </label>
          <input
            className="w-full rounded-xl border border-border bg-background/50 p-4 font-mono text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => onRecipientChange(e.target.value)}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground/90">
              {t.objetive} <span className="text-muted-foreground">({NETWORK.currency})</span>
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-border bg-background/50 p-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
              value={goal}
              onChange={(e) => onGoalChange(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <label className="block text-sm font-semibold text-foreground/90">
                {t.minThreshold} <span className="text-muted-foreground">({NETWORK.currency})</span>{" "}
                <span className="text-[10px] font-normal text-emerald-500/80">
                  (Min: {autoThreshold})
                </span>
              </label>
              {Number(minThreshold) > 0 && Number(minThreshold) >= Number(goal) && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] uppercase tracking-wider">
                  🎯 All or Nothing
                </span>
              )}
            </div>
            <input
              type="number"
            className="w-full rounded-xl border border-white/10 bg-background/50 p-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
              value={minThreshold}
              onChange={(e) => onMinThresholdChange(e.target.value)}
            />
          </div>

          {onDurationChange && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground/90">
                {t.timer}
              </label>
              <select
                className="w-full rounded-xl border border-border bg-background/50 p-4 text-foreground outline-none transition-all focus:border-emerald-500/50 focus:bg-background focus:ring-1 focus:ring-emerald-500/50"
                value={duration}
                onChange={(e) => onDurationChange(e.target.value)}
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background/50 p-4 text-center text-sm font-medium text-muted-foreground">
          {t.exitDiv}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !connected}
          className="w-full rounded-2xl bg-emerald-500 px-5 py-4 font-black text-lg text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-600 hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? t.creating : t.createProposal}
        </button>
      </div>
    </section>
  );
}