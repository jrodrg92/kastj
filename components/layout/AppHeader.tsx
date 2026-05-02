"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NETWORK } from "../../lib/network";
import { useUi } from "../../contexts/UiContext";
import { WalletStatus } from "../wallet/WalletStatus";
import { UiToggles } from "../../components/settings/UiToggles";
import { KastjLogo } from "../../components/brand/KastjLogo";
import { useWalletContext } from "../../contexts/WalletContext";

export function AppHeader() {
  const { connected } = useWalletContext();
  const { t } = useUi();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">
          <KastjLogo />
        </Link>

        {/* Center: Nav links — desktop only */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/#how-it-works" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.howItWorks}
          </Link>
          <Link href="/proposals" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.proposals}
          </Link>
        </nav>

        {/* Right: Controls — desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <UiToggles />
          {connected && (
            <Link
              href="/profile"
              className="flex h-9 items-center gap-2 rounded-full border border-border bg-card/50 px-3.5 text-sm font-semibold text-foreground transition-all hover:bg-accent active:scale-95"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-[10px] text-white">
                👤
              </div>
              {t.profile}
            </Link>
          )}
          <WalletStatus />
        </div>

        {/* Mobile: Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="absolute left-0 top-full w-full border-b border-border/60 bg-background/95 backdrop-blur-2xl p-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-2 mb-6">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl p-4 text-sm font-bold text-muted-foreground transition-all hover:bg-white/[0.03] hover:text-cyan-400 border border-transparent hover:border-white/[0.05]"
            >
              {t.howItWorks}
              <span className="text-[10px] opacity-30">→</span>
            </Link>
            <Link
              href="/proposals"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl p-4 text-sm font-bold text-muted-foreground transition-all hover:bg-white/[0.03] hover:text-cyan-400 border border-transparent hover:border-white/[0.05]"
            >
              {t.proposals}
              <span className="text-[10px] opacity-30">→</span>
            </Link>
            {connected && (
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl p-4 text-sm font-bold text-muted-foreground transition-all hover:bg-white/[0.03] hover:text-cyan-400 border border-transparent hover:border-white/[0.05]"
              >
                {t.profile}
                <span className="text-[10px] opacity-30">→</span>
              </Link>
            )}
          </nav>

          <div className="flex flex-col gap-6 pt-6 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{t.settings}</span>
              <UiToggles />
            </div>
            
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">{t.account}</span>
              <WalletStatus />
            </div>

            <Link
              href="/proposals/create"
              onClick={() => setMobileOpen(false)}
              className="premium-btn flex w-full items-center justify-center rounded-2xl py-4 text-sm font-black uppercase tracking-tighter"
            >
              {t.createProposal}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}