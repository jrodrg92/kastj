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
                Why <span className="text-cyan-500">Kastj?</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Conditional crowdfunding designed for transparency, community consensus, and security.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="premium-glass rounded-[2.5rem] p-8 border-white/[0.04] transition-all hover:border-cyan-500/20 group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Funds stay escrowed</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Money remains locked in a secure smart contract until a proposal reaches its predefined goal. No single party can access funds prematurely.
                </p>
              </div>

              <div className="premium-glass rounded-[2.5rem] p-8 border-white/[0.04] transition-all hover:border-cyan-500/20 group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
                  <Target size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Consensus before execution</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  The community decides what deserves funding. Proposals must meet a minimum consensus threshold to be considered successful.
                </p>
              </div>

              <div className="premium-glass rounded-[2.5rem] p-8 border-white/[0.04] transition-all hover:border-emerald-500/20 group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <RotateCcw size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Failed proposals are refundable</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  If a campaign fails to reach its goal or threshold, all supporters can withdraw their funds immediately. Zero risk for contributors.
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
                  Built for the <br />
                  <span className="text-cyan-500 font-black">Kaspa Community</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Kastj is designed to empower builders, contributors and communities funding public goods and innovative ideas on the Kaspa ledger.
                </p>
                
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                      <Zap size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">For builders</p>
                      <p className="text-sm text-muted-foreground">Get the resources you need without traditional gatekeepers.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                      <Heart size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">For supporters</p>
                      <p className="text-sm text-muted-foreground">Back the projects you love with full confidence in fund security.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">For communities</p>
                      <p className="text-sm text-muted-foreground">Collaborate on shared goals and foster decentralized growth.</p>
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
                   <p className="text-2xl font-black text-foreground">Community Driven</p>
                   <p className="mt-3 text-sm text-muted-foreground font-medium">Empowering the next generation of Kaspa innovators.</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ─── FAQ ─── */}
        <ScrollReveal>
          <section className="mx-auto max-w-3xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">FAQ</h2>
              <p className="text-muted-foreground">Everything you need to know about Kastj.</p>
            </div>

            <div className="space-y-4">
              {[
                { 
                  q: "What happens if a proposal fails?", 
                  a: "If a proposal doesn't reach its funding goal within the set timeframe, it is marked as failed. No funds are sent to the recipient, and the campaign is finalized on the blockchain." 
                },
                { 
                  q: "Can supporters withdraw their funds?", 
                  a: "Yes. If a proposal fails to meet its goal or consensus threshold, supporters can immediately withdraw their contributions through their profile or the proposal page." 
                },
                { 
                  q: "When are funds released?", 
                  a: "Funds are only released once the proposal successfully reaches its funding goal and meets the minimum consensus threshold. Only then can the recipient claim the funds." 
                },
                { 
                  q: "Do I need a wallet to use Kastj?", 
                  a: "You can browse proposals without a wallet, but you will need a compatible Kaspa wallet to create or fund proposals." 
                },
                { 
                  q: "Is Kastj custodial?", 
                  a: "No. Kastj is non-custodial. Funds are held in decentralized smart contracts on the Kaspa ledger and can only be moved according to the contract's predefined logic." 
                }
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
                Ready to fund the future?
              </h2>
              <p className="mx-auto max-w-xl text-lg font-medium opacity-80">
                Join the Kaspa community in supporting the next big ideas. Explore active campaigns or launch your own in minutes.
              </p>
              
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/proposals"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 sm:w-auto"
                >
                  <Search size={18} />
                  Explore Proposals
                </Link>
                <Link
                  href="/proposals/create"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black px-8 py-4 text-sm font-black uppercase tracking-widest transition-all hover:bg-black/5 hover:scale-105 active:scale-95 sm:w-auto"
                >
                  <Plus size={18} />
                  Create Proposal
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
