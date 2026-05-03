"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "../components/layout/AppHeader";
import { HeroSection } from "../components/landing/HeroSection";
import { HowItWorks } from "../components/landing/HowItWorks";
import { StatsBar } from "../components/dashboard/StatsBar";
import { SiteFooter } from "../components/landing/SiteFooter";
import { ScrollReveal } from "../components/ui/ScrollReveal";
import { useLanguage } from "../contexts/LanguageContext";
import { StatsSkeleton } from "../components/proposal/ProposalSkeleton";
import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "../features/proposals/queryKeys";
import { fetchStats } from "../features/proposals/api";
import { 
  ShieldCheck, 
  Target, 
  RotateCcw, 
  Zap, 
  Heart, 
  Users, 
  ChevronDown, 
  Plus, 
  Search,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export function LandingClient() {
  const { t } = useLanguage();

  const { isLoading } = useQuery({
    queryKey: [...proposalKeys.all, "stats"],
    queryFn: fetchStats,
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan-500/25">
      <AppHeader />

      <main className="mx-auto max-w-7xl space-y-24 px-4 py-10 md:px-8 md:space-y-32">
        {/* ─── HERO ─── */}
        <HeroSection />

        {/* ─── STATS ─── */}
        <ScrollReveal delay={100}>
          {isLoading ? <StatsSkeleton /> : <StatsBar />}
        </ScrollReveal>

        {/* ─── HOW IT WORKS ─── */}
        <ScrollReveal id="how-it-works">
          <HowItWorks />
        </ScrollReveal>

        {/* ─── WHY KASTJ (Simple Value Prop) ─── */}
        {/* ─── WHY KASTJ / TRUST ─── */}
        <ScrollReveal>
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                {t.whyKastj.split('?')[0]} <span className="text-cyan-500">{t.whyKastj.split('?')[1] || '?'}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.whyKastjDesc}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="premium-glass rounded-[2.5rem] p-8 border-white/[0.04] transition-all hover:border-cyan-500/20 group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t.fundsEscrowed}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t.fundsEscrowedDesc}
                </p>
              </div>

              <div className="premium-glass rounded-[2.5rem] p-8 border-white/[0.04] transition-all hover:border-cyan-500/20 group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
                  <Target size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t.consensusBefore}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t.consensusBeforeDesc}
                </p>
              </div>

              <div className="premium-glass rounded-[2.5rem] p-8 border-white/[0.04] transition-all hover:border-emerald-500/20 group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <RotateCcw size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t.failedRefundable}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t.failedRefundableDesc}
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ─── BUILT FOR THE COMMUNITY ─── */}
        <ScrollReveal>
          <section className="premium-glass rounded-[3rem] p-8 md:p-16 border-white/[0.04] bg-gradient-to-br from-cyan-500/[0.03] to-transparent">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-8">
                <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                  {t.builtFor.split('Kaspa')[0]} <br />
                  <span className="text-cyan-500 font-black">Kaspa {t.builtFor.split('Kaspa')[1]}</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t.builtForDesc}
                </p>
                
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                      <Zap size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t.forBuilders}</p>
                      <p className="text-sm text-muted-foreground">{t.forBuildersDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                      <Heart size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t.forSupporters}</p>
                      <p className="text-sm text-muted-foreground">{t.forSupportersDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t.forCommunities}</p>
                      <p className="text-sm text-muted-foreground">{t.forCommunitiesDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative aspect-square max-w-sm mx-auto lg:ml-auto">
                <div className="absolute inset-0 bg-cyan-500/20 blur-[120px] rounded-full animate-pulse" />
                <div className="relative z-10 h-full w-full rounded-[2rem] border border-white/10 bg-black/40 flex flex-col items-center justify-center p-8 text-center backdrop-blur-2xl">
                   <div className="mb-6 h-24 w-24 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                      <CheckCircle2 size={48} strokeWidth={1.5} />
                   </div>
                   <p className="text-2xl font-black text-foreground">{t.communityDriven}</p>
                   <p className="mt-3 text-sm text-muted-foreground font-medium">{t.communityDrivenDesc}</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ─── FAQ ─── */}
        <ScrollReveal>
          <section className="mx-auto max-w-3xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">{t.faqTitle}</h2>
              <p className="text-muted-foreground">{t.faqDesc}</p>
            </div>

            <div className="space-y-4">
              {[
                { q: t.faqQ1, a: t.faqA1 },
                { q: t.faqQ2, a: t.faqA2 },
                { q: t.faqQ3, a: t.faqA3 },
                { q: t.faqQ4, a: t.faqA4 },
                { q: t.faqQ5, a: t.faqA5 }
              ].map((item, i) => (
                <div key={i} className="premium-glass rounded-[1.5rem] border-white/[0.04] p-1 group">
                   <details className="group px-6 py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold text-foreground">
                        {item.q}
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground opacity-0 transition-all group-open:opacity-100">
                        {item.a}
                      </p>
                   </details>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ─── FINAL CTA ─── */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[3rem] bg-cyan-500 p-8 md:p-16 text-center text-black">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl font-black tracking-tighter md:text-6xl">
                {t.readyToFund}
              </h2>
              <p className="mx-auto max-w-xl text-lg font-medium opacity-80">
                {t.readyToFundDesc}
              </p>
              
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/proposals"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 sm:w-auto"
                >
                  <Search size={18} />
                  {t.exploreProposals}
                </Link>
                <Link
                  href="/proposals/create"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black px-8 py-4 text-sm font-black uppercase tracking-widest transition-all hover:bg-black/5 hover:scale-105 active:scale-95 sm:w-auto"
                >
                  <Plus size={18} />
                  {t.createProposal}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </main>

      <SiteFooter />
    </div>
  );
}
