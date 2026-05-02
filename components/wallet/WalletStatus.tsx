"use client";

import { useEffect, useState } from "react";
import { type JsonRpcSigner, formatEther } from "ethers";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";

export function WalletStatus({
  connected,
  address,
  connect,
  signer,
}: {
  connected: boolean;
  address: string;
  connect: () => void;
  signer: JsonRpcSigner | null;
}) {
  const [balance, setBalance] = useState<string>("0");

  const { t } = useLanguage();

  useEffect(() => {
    if (!signer || !connected) return;

    async function loadBalance() {
      try {
        const raw = await signer!.provider!.getBalance(address);
        setBalance(Number(formatEther(raw)).toFixed(4));
      } catch (e) {
        console.error(e);
      }
    }

    loadBalance();
  }, [signer, connected, address]);

  if (!connected) {
    return (
      <button
        onClick={connect}
        className="premium-btn flex h-9 items-center justify-center rounded-full px-5 text-sm font-bold"
      >
        {t.connectWallet}
      </button>
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
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    </div>
  );
}