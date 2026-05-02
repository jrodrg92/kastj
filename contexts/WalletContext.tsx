"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import type { WalletType } from "../core/ports/WalletAdapter";

interface WalletContextState {
    signer: any | null;
    address: string | undefined;
    connect: (type?: WalletType) => Promise<void>;
    disconnect: () => void;
    connected: boolean;
    walletType: WalletType | null;
    // Chain detection
    isKaspa: boolean;
}

const WalletContext = createContext<WalletContextState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [signer, setSigner] = useState<any | null>(null);
    const [address, setAddress] = useState<string | undefined>(undefined);
    const [walletType, setWalletType] = useState<WalletType | null>(null);

    const isKaspa = walletType === "kasware" || walletType === "kspr";

    useEffect(() => {
        const checkAutoConnect = async () => {
            if (typeof window === "undefined") return;
            
            const savedType = sessionStorage.getItem("kastj_wallet_type") as WalletType;
            if (savedType) {
                await connect(savedType, true);
            }
        };
        
        checkAutoConnect();
    }, []);

    async function connect(type: WalletType = "metamask", isAuto = false) {
        try {
            if (type === "metamask") {
                const ethereum = (window as any).ethereum;
                if (!ethereum) {
                    if (!isAuto) alert("Install MetaMask");
                    return;
                }
                const accounts = await ethereum.request({ method: "eth_requestAccounts" });
                if (accounts.length > 0) {
                    const provider = new BrowserProvider(ethereum);
                    const newSigner = await provider.getSigner();
                    setSigner(newSigner);
                    setAddress(await newSigner.getAddress());
                    setWalletType("metamask");
                }
            } else if (type === "kasware") {
                const kasware = (window as any).kasware;
                if (!kasware) {
                    if (!isAuto) alert("Install KasWare wallet");
                    return;
                }
                const accounts = await kasware.requestAccounts();
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    setSigner(kasware); // Kasware object acts as provider/signer
                    setWalletType("kasware");
                }
            }
            
            if (typeof window !== "undefined") {
                sessionStorage.setItem("kastj_wallet_type", type);
            }
        } catch (e) {
            console.error("Connection failed", e);
        }
    }
    
    function disconnect() {
        setSigner(null);
        setAddress(undefined);
        setWalletType(null);
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("kastj_wallet_type");
        }
    }

    return (
        <WalletContext.Provider
            value={{
                signer,
                address,
                connect,
                disconnect,
                connected: !!address,
                walletType,
                isKaspa,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWalletContext() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWalletContext must be used within a WalletProvider");
    }
    return context;
}
