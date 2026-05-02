"use client";

import { useEffect, useState } from "react";
import { formatEther } from "ethers";
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
  signer: any;
}) {
  const [balance, setBalance] = useState<string>("0");

  const { t } = useLanguage();

  useEffect(() => {
    if (!signer || !connected) return;

    async function loadBalance() {
      try {
        const raw = await signer.provider.getBalance(address);
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
        className="rounded-2xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
      >
        {t.connectWallet}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm md:flex-row md:items-center md:gap-4">
      
      <span className="text-zinc-400">
        {NETWORK.name}
      </span>

      <span className="font-semibold text-white">
        {balance} {NETWORK.currency}
      </span>

      {connected && address && (
        <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
      )}
    </div>
  );
}