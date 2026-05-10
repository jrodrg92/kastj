"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, Library } from "lucide-react";
import { useUi } from "../../contexts/UiContext";
import { WalletStatus } from "../wallet/WalletStatus";
import { UiToggles } from "../../components/settings/UiToggles";
import { KastjLogo } from "../../components/brand/KastjLogo";
import { useWalletContext } from "../../contexts/WalletContext";
import { NavDropdown } from "./NavDropdown";

export function AppHeader() {
  const { connected } = useWalletContext();
  const { t } = useUi();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  const resourceItems = [
    { label: t.howItWorks, href: "/#how-it-works" },
    { label: t.kaspa, href: "https://kaspa.org" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        
        {/* Left & Center Group */}
        <div className="flex items-center gap-10">
          {/* Left: Original Logo */}
          <Link href="/" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">
            <KastjLogo />
          </Link>

          {/* Center: New Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/proposals" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t.explore}
            </Link>
            <div className="h-3 w-[1px] bg-white/[0.1] mx-1" />
            <NavDropdown label={t.resources} items={resourceItems} />
            <div className="h-3 w-[1px] bg-white/[0.1] mx-1" />
            <Link href="/proposals/create" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t.createProposal}
            </Link>
          </nav>
        </div>

        {/* Right: Original Controls */}
        <div className="hidden items-center gap-2 md:flex">
          <UiToggles />
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
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl p-4 text-sm font-bold text-muted-foreground transition-all hover:bg-white/[0.03] hover:text-cyan-400 border border-transparent hover:border-white/[0.05]"
            >
              Home
              <span className="text-[10px] opacity-30">→</span>
            </Link>
            
            <Link
              href="/proposals"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl p-4 text-sm font-bold text-muted-foreground transition-all hover:bg-white/[0.03] hover:text-cyan-400 border border-transparent hover:border-white/[0.05]"
            >
              {t.exploreProposals}
              <span className="text-[10px] opacity-30">→</span>
            </Link>

            {/* Mobile Resources Submenu */}
            <div className="flex flex-col">
              <button 
                onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                className="flex items-center justify-between rounded-xl p-4 text-sm font-bold text-muted-foreground transition-all hover:bg-white/[0.03] hover:text-cyan-400 border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <Library size={16} />
                  {t.resources}
                </div>
                <ChevronRight size={16} className={`transition-transform duration-300 ${mobileResourcesOpen ? "rotate-90" : ""}`} />
              </button>
              
              {mobileResourcesOpen && (
                <div className="ml-4 flex flex-col gap-1 border-l border-white/[0.05] pl-4 mt-1 mb-2 animate-in slide-in-from-left-2 duration-200">
                   {resourceItems.map((item, idx) => (
                     <Link
                       key={idx}
                       href={item.href}
                       onClick={() => setMobileOpen(false)}
                       className="rounded-xl p-3 text-sm font-semibold text-muted-foreground/60 hover:text-cyan-400"
                     >
                       {item.label}
                     </Link>
                   ))}
                </div>
              )}
            </div>

            <Link
              href="/proposals/create"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl p-4 text-sm font-bold text-muted-foreground transition-all hover:bg-white/[0.03] hover:text-cyan-400 border border-transparent hover:border-white/[0.05]"
            >
              {t.createProposal}
              <span className="text-[10px] opacity-30">→</span>
            </Link>
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