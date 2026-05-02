"use client";

import { useMemo } from "react";
import { formatEther } from "ethers";
import Link from "next/link";

import { useLocalWallet } from "../../hooks/useLocalWallet";
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
    const wallet = useLocalWallet();
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
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#13231f,_#09090b_45%)] px-4 py-8 text-white md:px-8">
                <div className="mx-auto max-w-5xl space-y-8">
                    <AppHeader
                        connected={wallet.connected}
                        address={wallet.address}
                        connect={wallet.connect}
                        signer={wallet.signer}
                    />
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-12 text-center">
                        <p className="text-xl text-zinc-400">
                            {t.conectWallet}
                        </p>
                        <button
                            onClick={wallet.connect}
                            className="mt-6 rounded-2xl bg-green-500 px-8 py-4 font-bold text-black hover:bg-green-400"
                        >
                            {t.connectWallet}
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#13231f,_#09090b_45%)] px-4 py-8 text-white md:px-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <AppHeader
                    connected={wallet.connected}
                    address={wallet.address}
                    connect={wallet.connect}
                    signer={wallet.signer}
                />

                {/* Profile Header */}
                <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 text-2xl font-black text-black">
                            {wallet.address?.slice(2, 4).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">
                                {t.mydsbrd}
                            </h1>
                            <p className="mt-1 font-mono text-sm text-zinc-400">
                                {short(wallet.address)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-sm text-zinc-400">
                            {t.totCont}
                        </p>
                        <p className="mt-2 text-2xl font-black">
                            {Number(d.totalContributed).toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {NETWORK.currency}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-sm text-zinc-400">
                            {t.crrnlyUnclck}
                        </p>
                        <p className="mt-2 text-2xl font-black text-amber-400">
                            {Number(d.activeContributed).toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {NETWORK.currency}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-sm text-zinc-400">{t.withdrw}</p>
                        <p className="mt-2 text-2xl font-black text-green-400">
                            {Number(d.withdrawable).toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {NETWORK.currency}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-sm text-zinc-400">
                            {t.crtdByMe} / {t.suprtd}
                        </p>
                        <p className="mt-2 text-2xl font-black">
                            {d.createdCount}{" "}
                            <span className="text-zinc-500">/</span>{" "}
                            {d.supportedCount}
                        </p>
                    </div>
                </section>

                {/* My Proposals */}
                <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
                    <h2 className="text-2xl font-bold">{t.crtdByMe}</h2>

                    {myProposals.length === 0 && (
                        <p className="mt-4 text-zinc-400">
                            {t.noProposalsFilter}
                        </p>
                    )}

                    <div className="mt-4 space-y-3">
                        {myProposals.map((p) => (
                            <Link
                                key={p.id}
                                href={`/proposal/${p.id}`}
                                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600"
                            >
                                <div>
                                    <p className="font-bold">
                                        Proposal #{p.id}
                                    </p>
                                    <p className="text-sm text-zinc-400">
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
                <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
                    <h2 className="text-2xl font-bold">
                        {t.recentActivity}
                    </h2>

                    {myActivity.length === 0 && (
                        <p className="mt-4 text-zinc-400">
                            {t.noActivityYet}
                        </p>
                    )}

                    <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-2">
                        {myActivity.map((item) => {
                            const amount = formatActivityAmount(
                                item.amount,
                            );

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                                >
                                    <span className="text-xl">
                                        {item.type === "created"
                                            ? "🆕"
                                            : item.type === "funded"
                                              ? "💸"
                                              : item.type === "succeeded"
                                                ? "✅"
                                                : "❌"}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-semibold">
                                            {item.message}
                                        </p>
                                        <p className="text-sm text-zinc-400">
                                            Proposal #
                                            {item.proposal_id}
                                            {amount &&
                                                ` · ${amount} ${NETWORK.currency}`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-zinc-500">
                                        {new Date(
                                            item.created_at ?? 0,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="text-center">
                    <Link
                        href="/"
                        className="inline-block rounded-2xl bg-zinc-800 px-6 py-3 font-bold text-white transition hover:bg-zinc-700"
                    >
                        {t.backToProposals}
                    </Link>
                </div>
            </div>
        </main>
    );
}
