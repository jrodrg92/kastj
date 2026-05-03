import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
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
  const [step, setStep] = useState(1);

  const durationOptions = [
    { label: t.min10, value: "600" },
    { label: t.hour1, value: "3600" },
    { label: t.day1, value: "86400" },
    { label: t.days7, value: "604800" },
    { label: t.days30, value: "2592000" },
  ];

  const canGoToStep2 = title.trim() !== "" && description.trim() !== "" && recipient.trim() !== "";
  const canGoToStep3 = goal.trim() !== "" && minThreshold.trim() !== "";

  async function handleSubmit() {
    if (!connected) {
      toast.error(t.connectWalletFirst);
      return;
    }
    await onCreate();
    if (!loading) {
        // Optimistically reset step on submit start if we want, but better let the parent handle success and we just wait.
        // The parent resets the fields on success, maybe we should reset step too?
        // For now, if the fields are emptied by parent, the user will see step 3 empty. 
        // We can add an effect to reset to step 1 if title becomes empty.
    }
  }

  // Effect to reset wizard when form is reset by parent
  useEffect(() => {
    if (title === "" && description === "" && step !== 1) {
      setStep(1);
    }
  }, [title, description, step]);

  return (
    <section className="premium-glass rounded-[2rem] p-6 md:p-10">
      {/* ─── Header & Stepper ─── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.createProposal}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.followSteps}
            </p>
          </div>
          <span className="hidden md:inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-sm font-semibold text-cyan-500">
            {NETWORK.name}
          </span>
        </div>

        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-[16.66%] top-4 z-0 h-0.5 w-[66.66%] -translate-y-1/2 bg-white/[0.05]">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>

          <div className="relative z-10 grid grid-cols-3">
            {[
              { num: 1, label: t.basics },
              { num: 2, label: t.funding },
              { num: 3, label: t.review }
            ].map((s) => {
              const isPast = step > s.num;
              const isActive = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                    isActive 
                      ? "bg-cyan-500 text-white ring-4 ring-cyan-500/20" 
                      : isPast 
                        ? "bg-background text-cyan-400 border border-cyan-500/30" 
                        : "bg-background border border-border text-muted-foreground"
                  }`}>
                    {isPast ? <Check size={14} strokeWidth={3} /> : s.num}
                  </div>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider hidden sm:block ${
                    isActive ? "text-cyan-500" : isPast ? "text-cyan-500/70" : "text-muted-foreground/50"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Step 1: Basics ─── */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground/90">
              {t.title}
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-background/50 p-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-cyan-500/40 focus:bg-background focus:ring-1 focus:ring-cyan-500/30"
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
              className="min-h-[120px] w-full resize-y rounded-xl border border-white/10 bg-background/50 p-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-cyan-500/40 focus:bg-background focus:ring-1 focus:ring-cyan-500/30"
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
              className="w-full rounded-xl border border-white/10 bg-background/50 p-3.5 font-mono text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-cyan-500/40 focus:bg-background focus:ring-1 focus:ring-cyan-500/30"
              placeholder="kaspa:..."
              value={recipient}
              onChange={(e) => onRecipientChange(e.target.value)}
            />
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-cyan-600 disabled:opacity-50"
            >
              {t.continue} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Funding ─── */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground/90">
                {t.objetive} <span className="text-muted-foreground">({NETWORK.currency})</span>
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-background/50 p-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-cyan-500/40 focus:bg-background focus:ring-1 focus:ring-cyan-500/30"
                value={goal}
                onChange={(e) => onGoalChange(e.target.value)}
              />
            </div>

            {onDurationChange && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground/90">
                  {t.timer}
                </label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-background/50 p-3.5 text-sm text-foreground outline-none transition-all focus:border-cyan-500/40 focus:bg-background focus:ring-1 focus:ring-cyan-500/30"
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

          <div>
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="block text-sm font-semibold text-foreground/90">
                {t.minThreshold} <span className="text-muted-foreground">({NETWORK.currency})</span>{" "}
                <span className="text-[10px] font-normal text-cyan-500/80">
                  (Min: {autoThreshold})
                </span>
              </label>
              {Number(minThreshold) > 0 && Number(minThreshold) >= Number(goal) && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-500 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] uppercase tracking-wider">
                  🎯 All or Nothing
                </span>
              )}
            </div>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-background/50 p-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-cyan-500/40 focus:bg-background focus:ring-1 focus:ring-cyan-500/30"
              value={minThreshold}
              onChange={(e) => onMinThresholdChange(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-background/30 p-4 text-center text-xs text-muted-foreground">
            {t.exitDiv}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-card/50 px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
            >
              <ArrowLeft size={16} /> {t.back}
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canGoToStep3}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-cyan-600 disabled:opacity-50"
            >
              {t.review} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Review ─── */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.02] p-5 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{description}</p>
            
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t.goalLabel}</p>
                <p className="mt-1 text-sm font-bold text-foreground">{goal} <span className="text-[10px] text-muted-foreground">{NETWORK.currency}</span></p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t.minThreshold}</p>
                <p className="mt-1 text-sm font-bold text-cyan-400">{minThreshold} <span className="text-[10px] text-cyan-400/50">{NETWORK.currency}</span></p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t.receiver}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground break-all">{recipient}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-card/50 px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-accent disabled:opacity-50 w-full sm:w-auto"
            >
              <ArrowLeft size={16} /> {t.back}
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !connected}
              className="premium-btn flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t.creating}
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} />
                  {t.publishProposal}
                </>
              )}
            </button>
          </div>
          
          {!connected && (
             <p className="text-center text-xs text-rose-400 mt-2">{t.connectWalletFirst}</p>
          )}
        </div>
      )}
    </section>
  );
}