"use client";

import { useState } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import type { WalletAdapter } from "../core/ports/WalletAdapter";

/**
 * MetaMask/EVM wallet hook.
 *
 * Returns a wallet interface conforming to WalletAdapter semantics.
 * When Kaspa L1 wallets are needed, create useKaswareWallet() or
 * useKsprWallet() hooks implementing the same return shape.
 */
export function useLocalWallet(): {
    signer: JsonRpcSigner | null;
    address: string | undefined;
    connect: () => Promise<void>;
    connected: boolean;
    walletType: WalletAdapter["type"];
} {
    const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
    const [address, setAddress] = useState<string | undefined>(undefined);

    async function connect() {
        const ethereum = (window as unknown as Record<string, unknown>).ethereum as
            | {
                  request: (args: {
                      method: string;
                      params?: unknown[];
                  }) => Promise<unknown>;
              }
            | undefined;

        if (!ethereum) {
            alert("Install MetaMask or a compatible EVM wallet.");
            return;
        }

        await ethereum.request({ method: "eth_requestAccounts" });

        const provider = new BrowserProvider(
            ethereum as ConstructorParameters<typeof BrowserProvider>[0],
        );
        const newSigner = await provider.getSigner();

        setSigner(newSigner);
        setAddress(await newSigner.getAddress());
    }

    return {
        signer,
        address,
        connect,
        connected: Boolean(signer),
        walletType: "metamask",
    };
}