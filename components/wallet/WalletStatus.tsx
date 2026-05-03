"use client";

import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import { NETWORK } from "../../lib/network";
import { useUi } from "../../contexts/UiContext";
import { useWalletContext } from "../../contexts/WalletContext";

export function WalletStatus() {
  const { connected, address, signer, connect, walletType } = useWalletContext();
  const [balance, setBalance] = useState<string>("0");
  const { t } = useUi();

  useEffect(() => {
    if (!signer || !connected || !address) return;

    async function loadBalance() {
      try {
        if (walletType === "metamask") {
            const raw = await signer.provider!.getBalance(address);
            setBalance(Number(formatEther(raw)).toFixed(4));
        } else if (walletType === "kasware") {
            const result = await signer.getBalance();
            // result is { confirmed: number, unconfirmed: number, total: number } in sompis
            setBalance((Number(result.total) / 1e8).toFixed(2));
        }
      } catch (e) {
        console.error("Failed to load balance", e);
      }
    }

    loadBalance();
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, [signer, connected, address, walletType]);

  if (!connected) {
    return (
      <div className="flex items-center gap-2">
        <button
            onClick={() => connect("metamask")}
            className="premium-btn flex h-10 items-center justify-center rounded-full px-5 text-sm font-bold"
        >
            {t.connectWallet} (EVM)
        </button>
        <button
            onClick={() => connect("kasware")}
            className="flex h-10 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground hover:bg-accent"
        >
            KasWare
        </button>
      </div>
    );
  }

  return (
    <div className="premium-glass flex h-10 items-center gap-3 rounded-full pl-4 pr-1.5 text-sm font-semibold transition-all hover:shadow-lg">
      <div className="flex items-center gap-2">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
        </div>
        <span className="text-foreground/90">
          {balance} <span className="text-[10px] text-muted-foreground uppercase">{NETWORK.currency}</span>
        </span>
      </div>
      
      <div className="flex h-7 items-center gap-2 rounded-full bg-background/80 px-3 font-mono text-[11px] text-cyan-500 border border-cyan-500/20 shadow-inner">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-500/10">
          {walletType === "kasware" ? (
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-cyan-500" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 12l10 10 10-10L12 2zM4.5 12l7.5-7.5 7.5 7.5-7.5 7.5-7.5-7.5z" />
            </svg>
          ) : (
            <svg viewBox="0 0 256 417" className="h-2.5 w-2.5 fill-cyan-500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
              <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
              <path d="M127.962 0L0 212.32l127.962 75.638V154.158z" />
              <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.59 128.038-180.32z" />
              <path d="M127.962 416.896V312.187L0 236.386z" />
              <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" />
              <path d="M0 212.32l127.962 75.638V154.158z" />
            </svg>
          )}
        </div>
        <span className="opacity-80">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>
    </div>
  );
}