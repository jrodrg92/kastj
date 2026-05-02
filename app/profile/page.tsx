"use client";

import { useMemo } from "react";
import { formatEther } from "ethers";
import Link from "next/link";

import { useWalletContext } from "../../contexts/WalletContext";
import { useProposalEngine } from "../../hooks/useProposalEngine";
import { useUserDashboard } from "../../hooks/useUserDashboard";
import { useActivityFeed } from "../../hooks/useActivityFeed";
import { AppHeader } from "../../components/layout/AppHeader";
import { useLanguage } from "../../contexts/LanguageContext";
import { NETWORK } from "../../lib/network";
import { useInfiniteProposals } from "../../features/proposals/hooks/useInfiniteProposals";

function short(addr?: string) {
    if (!addr) return "";
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

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

    if (!wallet.connected) {
        return (
            <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8 selection:bg-emerald-500/30">
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/5 via-background to-background"></div>
                <div className="mx-auto max-w-5xl space-y-8">
                    <AppHeader />
                    <div className="rounded-3xl border border-border bg-card/50 p-12 text-center shadow-xl backdrop-blur-xl">
                        <p className="text-xl text-muted-foreground">
                            {t.conectWallet}
                        </p>
                        <button
                            onClick={wallet.connect}
                            className="mt-6 rounded-2xl bg-emerald-600 px-8 py-4 font-bold text-white transition hover:bg-emerald-500"
                        >
                            {t.connectWallet}
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8 selection:bg-emerald-500/30">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/5 via-background to-background"></div>
            <div className="mx-auto max-w-5xl space-y-8">
                <AppHeader />

                {/* Profile Header */}
                <div className="premium-glass mb-8 rounded-3xl p-8 lg:p-10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            👤
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                {t.mydsbrd}
                            </h1>
                            <p className="font-mono text-muted-foreground mt-1">
                                {wallet.address}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="premium-glass rounded-2xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">
                            {t.totCont}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                            {Number(d.totalContributed).toFixed(4)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {NETWORK.currency}
                        </p>
                    </div>

                    <div className="premium-glass rounded-2xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">
                            {t.crrnlyUnclck}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-amber-500">
                            {Number(d.activeContributed).toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {NETWORK.currency}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-xl">
                        <p className="text-sm font-medium text-muted-foreground">{t.withdrw}</p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-500">
                            {Number(d.withdrawable).toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {NETWORK.currency}
                        </p>
                    </div>

                    <div className="premium-glass rounded-2xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">
                            {t.crtdByMe} / {t.suprtd}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                            {d.createdCount}{" "}
                            <span className="text-muted-foreground">/</span>{" "}
                            {d.supportedCount}
                        </p>
                    </div>
                </section>

                {/* My Proposals */}
                <section className="premium-glass rounded-3xl p-8 lg:p-10">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.crtdByMe}</h2>

                    {myProposals.length === 0 && (
                        <p className="mt-4 text-muted-foreground">
                            {t.noProposalsFilter}
                        </p>
                    )}

                    <div className="mt-4 space-y-3">
                        {myProposals.map((p) => (
                            <Link
                                key={p.id}
                                href={`/proposal/${p.id}`}
                                className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4 transition-all hover:bg-card/80 hover:shadow-md"
                            >
                                <div>
                                    <p className="font-semibold text-foreground">
                                        Proposal #{p.id}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {Number(p.totalRaised).toFixed(4)} /{" "}
                                        {Number(p.goal).toFixed(4)}{" "}
                                        {NETWORK.currency}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                                        p.status === 0
                                            ? "bg-yellow-500/10 text-yellow-400"
                                            : p.status === 1
                                              ? "bg-green-500/10 text-green-400"
                                              : "bg-red-500/10 text-red-400"
                                    }`}
                                >
                                    {p.status === 0
                                        ? t.active
                                        : p.status === 1
                                          ? t.succeeded
                                          : t.failed}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* My Activity */}
                <section className="premium-glass rounded-3xl p-8 lg:p-10">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {t.recentActivity}
                    </h2>

                    {myActivity.length === 0 && (
                        <p className="mt-4 text-muted-foreground">
                            {t.noActivityYet}
                        </p>
                    )}

                    <div className="mt-5 max-h-[400px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {myActivity.map((item) => {
                            const amount = formatActivityAmount(
                                item.amount,
                            );

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 rounded-2xl border border-border bg-background/50 p-4 transition-all hover:bg-card/80"
                                >
                                    <span className="text-xl flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">
                                        {item.type === "created"
                                            ? "✨"
                                            : item.type === "funded"
                                              ? "💎"
                                              : item.type === "succeeded"
                                                ? "✅"
                                                : "❌"}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">
                                            {item.message}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Proposal #
                                            {item.proposal_id}
                                            {amount &&
                                                ` · ${amount} ${NETWORK.currency}`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">
                                        {new Date(
                                            item.created_at ?? 0,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>


            </div>
        </main>
    );
}
