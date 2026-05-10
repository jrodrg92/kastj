import { Lightbulb, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

type Step = {
  icon: LucideIcon;
  num: string;
  titleKey: "step1" | "step2" | "step3";
  descKey: "step11" | "step21" | "step31";
};

const STEPS: Step[] = [
  { icon: Lightbulb, num: "01", titleKey: "step1", descKey: "step11" },
  { icon: Users,     num: "02", titleKey: "step2", descKey: "step21" },
  { icon: Zap,       num: "03", titleKey: "step3", descKey: "step31" },
];

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="space-y-8">
      {/* Section heading */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500">
          {t.howItWorks}
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t.threeSteps}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          {t.threeStepsDesc}
        </p>
      </div>

      {/* Steps grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
              <div
                key={s.num}
                className="premium-glass group relative overflow-hidden rounded-[2.5rem] border-white/[0.04] p-8 transition-all duration-500 hover:border-cyan-500/20 hover:shadow-[0_20px_50px_rgba(6,182,212,0.05)]"
              >
                {/* Decorative background glow */}
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl transition-all duration-500 group-hover:bg-cyan-500/10" />

                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 transition-all duration-500 group-hover:scale-110 group-hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <span className="text-4xl font-black tracking-tighter text-white/5 transition-colors duration-500 group-hover:text-cyan-500/10">
                    {s.num}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground tracking-tight">{t[s.titleKey]}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  {t[s.descKey]}
                </p>
              </div>
          );
        })}
      </div>
    </section>
  );
}
