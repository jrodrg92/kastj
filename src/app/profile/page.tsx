"use client";

import { useMemo, useState } from "react";
import { formatEther } from "ethers";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
    Wallet, Lock, Unlock, Activity, Copy, Check, 
    ArrowRight, FileText, Target, CheckCircle2, XCircle, 
    Coins
} from "lucide-react";

import { useWalletContext } from "../../contexts/WalletContext";
import { useUserDashboard } from "../../hooks/useUserDashboard";
import { useActivityFeed } from "../../hooks/useActivityFeed";
import { AppHeader } from "../../components/layout/AppHeader";
import { useLanguage } from "../../contexts/LanguageContext";
import { NETWORK } from "../../lib/network";
import { useInfiniteProposals } from "../../features/proposals/hooks/useInfiniteProposals";

import { short, statusLabel } from "../../lib/proposalUtils";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScrollReveal } from "../../components/ui/ScrollReveal";

function formatActivityAmount(amount?: string | null) {
    if (!amount) return null;
    try {
        return Number(formatEther(BigInt(amount))).toFixed(4);
    } catch {
        return null;
    }
}

export default function ProfilePage() {
    const wallet = useWalletContext();
    const { t } = useLanguage();
    const dashboard = useUserDashboard(wallet.address);
    const feed = useActivityFeed();
    const proposalsQuery = useInfiniteProposals();

    const [copied, setCopied] = useState(false);

    const allProposals = useMemo(
        () => proposalsQuery.data?.pages.flatMap((p) => p.items) ?? [],
        [proposalsQuery.data],
    );

    const myProposals = useMemo(
        () =>
            allProposals.filter(
                (p) =>
                    p.creator.toLowerCase() ===
                    wallet.address?.toLowerCase(),
            ),
        [allProposals, wallet.address],
    );

    const myActivity = useMemo(
        () =>
            feed.activity.filter(
                (a) =>
                    a.actor?.toLowerCase() ===
                    wallet.address?.toLowerCase(),
            ),
        [feed.activity, wallet.address],
    );

    const d = dashboard.dashboard;

    const handleCopyAddress = () => {
        if (wallet.address) {
            navigator.clipboard.writeText(wallet.address);
            setCopied(true);
            toast.success("Address copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!wallet.connected) {
        return (
            <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30">
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/5 via-background to-background"></div>
                <AppHeader />
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-20 md:px-8">
                    <ScrollReveal>
                        <div className="premium-glass max-w-md overflow-hidden rounded-[2rem] text-center shadow-2xl">
                            <div className="bg-gradient-to-br from-cyan-500/10 via-background to-background p-10">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                    <Wallet className="h-10 w-10 text-cyan-500" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.conectWallet}</h1>
                                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                                    Connect your Kaspa wallet to track your proposals, backing activity, and community impact.
                                </p>
                                <button
                                    onClick={() => wallet.connect()}
                                    className="premium-btn mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold shadow-lg"
                                >
                                    {t.connectWallet}
                                </button>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </main>
        );
    }

    const totalContributed = Number(d.totalContributed);
    const activeContributed = Number(d.activeContributed);
    const lockedPercent = totalContributed > 0 ? (activeContributed / totalContributed) * 100 : 0;

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/5 via-background to-background"></div>
            
            <AppHeader />

            <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 md:px-8">
                
                {/* ─── Profile Hero ─── */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.04] via-card/50 to-background p-8 lg:p-10 premium-glass">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
                        
                        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                    <Wallet className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                                            Portfolio
                                        </h1>
                                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                            {NETWORK.name} Ecosystem
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground/80">
                                        Track your proposals, backing activity, and community impact.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Connected Address</p>
                                <button 
                                    onClick={handleCopyAddress}
                                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-background/50 px-4 py-3 transition-all hover:bg-card hover:border-cyan-500/30"
                                >
                                    <span className="font-mono text-sm font-semibold text-foreground">
                                        {short(wallet.address || "")}
                                    </span>
                                    <div className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${copied ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.05] text-muted-foreground group-hover:text-cyan-400'}`}>
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ─── Metrics Grid ─── */}
                <ScrollReveal delay={100}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Total Backed */}
                        <div className="premium-glass rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                                    <Coins size={16} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.totCont}</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black tracking-tight text-foreground">
                                    {totalContributed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </p>
                                <span className="text-xs font-bold text-muted-foreground/60">{NETWORK.currency}</span>
                            </div>

                            {/* Mini Distribution Chart */}
                            {totalContributed > 0 && (
                                <div className="mt-5">
                                    <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-amber-500/90">Locked ({lockedPercent.toFixed(0)}%)</span>
                                        <span className="text-muted-foreground/50">Total</span>
                                    </div>
                                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                        <div 
                                            className="h-full rounded-full bg-amber-500 transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                                            style={{ width: `${lockedPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active/Locked */}
                        <div className="premium-glass rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                                    <Lock size={16} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.crrnlyUnclck}</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black tracking-tight text-foreground">
                                    {activeContributed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </p>
                                <span className="text-xs font-bold text-muted-foreground/60">{NETWORK.currency}</span>
                            </div>
                            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                                Funds actively locked in escrow contracts awaiting resolution.
                            </p>
                        </div>

                        {/* Withdrawable */}
                        <div className="premium-glass rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                                    <Unlock size={16} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.withdrw}</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black tracking-tight text-foreground">
                                    {Number(d.withdrawable).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </p>
                                <span className="text-xs font-bold text-muted-foreground/60">{NETWORK.currency}</span>
                            </div>
                            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                                Funds available to claim from failed or expired proposals.
                            </p>
                        </div>

                        {/* Impact */}
                        <div className="premium-glass rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                    <Target size={16} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impact</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black tracking-tight text-foreground">
                                    {d.createdCount} <span className="text-xl text-muted-foreground font-medium px-1">/</span> {d.supportedCount}
                                </p>
                            </div>
                            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                                Total proposals created vs total proposals backed.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ─── Two Column Layout for Lists ─── */}
                <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
                    
                    {/* ─── User Proposals ─── */}
                    <ScrollReveal delay={200}>
                        <div className="premium-glass rounded-[2rem] p-6 md:p-8">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                                        <FileText size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">{t.crtdByMe}</h2>
                                </div>
                                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {myProposals.length} {t.proposals}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {myProposals.length === 0 ? (
                                    <div className="rounded-2xl border border-white/[0.06] bg-background/30 p-8 text-center">
                                        <p className="text-sm text-muted-foreground">You haven't created any proposals yet.</p>
                                        <Link href="/#create" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-500 hover:text-cyan-400">
                                            Create your first proposal <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                ) : (
                                    myProposals.map((p) => {
                                        const statusColor = p.status === 0 ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/10" 
                                            : p.status === 1 ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/10" 
                                            : "text-rose-400 border-rose-500/20 bg-rose-500/10";
                                        
                                        const statusText = p.status === 0 ? t.activeStatus : p.status === 1 ? t.succeededStatus : t.failedStatus;

                                        return (
                                            <Link
                                                key={p.id}
                                                href={`/proposal/${p.id}`}
                                                className="group flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-background/40 p-5 transition-all hover:bg-card hover:border-cyan-500/30 hover:shadow-lg"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                                                            Proposal #{p.id}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {Number(p.totalRaised).toFixed(0)} / {Number(p.goal).toFixed(0)} {NETWORK.currency}
                                                        </p>
                                                    </div>
                                                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                </div>
                                                <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${p.status === 0 ? 'bg-cyan-500' : p.status === 1 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-rose-500'}`} 
                                                        style={{ width: `${Math.min((Number(p.totalRaised) / Number(p.goal)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* ─── Activity Feed ─── */}
                    <ScrollReveal delay={300}>
                        <div className="premium-glass rounded-[2rem] p-6 md:p-8">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                        <Activity size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">{t.recentActivity}</h2>
                                </div>
                                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {myActivity.length} Events
                                </span>
                            </div>

                            <div className="space-y-4">
                                {myActivity.length === 0 ? (
                                    <div className="rounded-2xl border border-white/[0.06] bg-background/30 p-8 text-center">
                                        <p className="text-sm text-muted-foreground">No recent activity found.</p>
                                    </div>
                                ) : (
                                    <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                        {myActivity.map((item) => {
                                            const amount = formatActivityAmount(item.amount);
                                            let Icon = Activity;
                                            let iconClass = "bg-secondary text-secondary-foreground";
                                            
                                            if (item.type === "created") { Icon = FileText; iconClass = "bg-blue-500/10 text-blue-500"; }
                                            if (item.type === "funded") { Icon = Coins; iconClass = "bg-cyan-500/10 text-cyan-500"; }
                                            if (item.type === "succeeded") { Icon = CheckCircle2; iconClass = "bg-cyan-500/10 text-cyan-400"; }
                                            if (item.type === "failed") { Icon = XCircle; iconClass = "bg-rose-500/10 text-rose-400"; }

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-background/40 p-4 transition-all hover:bg-card hover:border-cyan-500/20"
                                                >
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${iconClass}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-foreground">{item.message}</p>
                                                        <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                                                            <span>Proposal #{item.proposal_id}</span>
                                                            {amount && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="font-semibold text-foreground/80">{amount} {NETWORK.currency}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                    
                                                    <span className="text-[10px] font-medium text-muted-foreground/50 shrink-0">
                                                        {new Date(item.created_at ?? 0).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

            </div>
        </main>
    );
}
