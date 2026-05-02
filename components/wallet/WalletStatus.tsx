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
    <div className="flex h-9 items-center gap-3 rounded-full border border-border bg-card/50 pl-4 pr-1 text-sm font-medium transition-colors hover:bg-accent">
      <span className="text-muted-foreground">
        {balance} <span className="opacity-50">{NETWORK.currency}</span>
      </span>
      <div className="flex h-7 items-center rounded-full bg-background px-3 text-emerald-600 dark:text-emerald-400 border border-border shadow-sm">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    </div>
  );
}