import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";
import { NETWORK } from "../../lib/network";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-gradient-to-b from-card/80 to-card/40 px-6 py-16 backdrop-blur-xl lg:px-16 lg:py-24">
      {/* Dot grid background */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-60" />

      {/* Glow accents */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.05] blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* ─── Left: Copy ─── */}
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wide text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            {t.autScrow}
          </div>

          {/* Headline */}
          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-[-0.03em] text-foreground md:text-5xl lg:text-6xl">
            {t.mission}
          </h1>

          {/* Subheadline */}
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            {t.mission1}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/proposals/create"
              className="premium-btn rounded-full px-7 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.createProposal}
            </Link>
            <Link
              href="/proposals"
              className="rounded-full border border-border bg-background/50 px-7 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-cyan-500/[0.04] active:scale-[0.98]"
            >
              {t.exploreProposals}
            </Link>
          </div>
        </div>

        {/* ─── Right: Mockup Card ─── */}
        <div className="w-full max-w-md flex-shrink-0 lg:w-[420px]">
          <HeroMockupCard />
        </div>
      </div>
    </section>
  );
}

/* ─── Static mockup card for the hero ─── */
function HeroMockupCard() {
  const { t } = useLanguage();
  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-card/60 p-6 backdrop-blur-xl transition-all duration-500 hover:border-cyan-500/20 hover:shadow-[0_0_40px_rgba(6,182,212,0.06)]">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-foreground">{t.mockTitle}</h4>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">{t.proposalHash}42</p>
        </div>
        <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
          {t.active}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {t.mockDesc}
      </p>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/[0.06] bg-background/30 px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">{t.raisedLabel}</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">8,420 <span className="text-[9px] text-muted-foreground">{NETWORK.currency}</span></p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-background/30 px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">{t.unicSup}</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">127</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-background/30 px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">{t.minThreshold}</p>
          <p className="mt-0.5 text-sm font-bold text-cyan-400">70%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] font-medium">
          <span className="text-muted-foreground">8,420 / 10,000 {NETWORK.currency}</span>
          <span className="text-emerald-400">84.2%</span>
        </div>
        <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          {/* Threshold marker */}
          <div className="absolute top-0 bottom-0 z-10 w-[1.5px] bg-white/60" style={{ left: "70%" }} />
          {/* Fill */}
          <div className="h-full w-[84.2%] rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all duration-1000" />
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-5 flex items-center justify-between">
        {[
          { label: t.basics, done: true },
          { label: t.funding, done: true },
          { label: t.review, done: false },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-1.5">
            <div className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold ${
              step.done
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/[0.06] text-muted-foreground/40 border border-white/[0.06]"
            }`}>
              {step.done ? "✓" : (i + 1)}
            </div>
            <span className={`text-[10px] font-medium ${step.done ? "text-foreground/80" : "text-muted-foreground/40"}`}>
              {step.label}
            </span>
            {i < 2 && (
              <div className={`mx-1 h-px w-4 ${step.done ? "bg-cyan-500/30" : "bg-white/[0.06]"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
