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
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
        </div>
        <span className="text-foreground/90">
          {balance} <span className="text-[10px] text-muted-foreground uppercase">{NETWORK.currency}</span>
        </span>
      </div>
      
      <div className="flex h-7 items-center rounded-full bg-background/80 px-3 font-mono text-[11px] text-emerald-500 border border-emerald-500/20 shadow-inner">
        {walletType === "kasware" ? "K" : "E"}: {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>
    </div>
  );
}