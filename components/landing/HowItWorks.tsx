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
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-7 transition-all duration-300 hover:border-cyan-500/20 hover:bg-card/80"
            >
              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 transition-colors group-hover:bg-cyan-500/15">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-bold tracking-widest text-muted-foreground/30">
                  {s.num}
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground">{t[s.titleKey]}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t[s.descKey]}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
