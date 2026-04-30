"use client";

import { useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

export function useLocalWallet() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string>("");

  async function connect() {
    if (!window.ethereum) {
      alert("Instala MetaMask o una wallet compatible EVM.");
      return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    setSigner(signer);
    setAddress(await signer.getAddress());
  }

  return {
    signer,
    address,
    connect,
    connected: Boolean(signer),
  };
}