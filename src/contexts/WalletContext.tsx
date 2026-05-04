"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import toast from "react-hot-toast";
import { useLanguage } from "./LanguageContext";
import type { WalletType } from "../core/ports/WalletAdapter";

interface WalletContextState {
    signer: any | null;
    provider: BrowserProvider | null;
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
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [address, setAddress] = useState<string | undefined>(undefined);
    const [walletType, setWalletType] = useState<WalletType | null>(null);
    const { t } = useLanguage();

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

    // Listen to wallet events
    useEffect(() => {
        if (!walletType || typeof window === "undefined") return;

        const handleAccountsChanged = (accounts: string[]) => {
            console.log("Accounts changed", accounts);
            if (accounts.length === 0) {
                disconnect();
            } else {
                // Silently reconnect to update address and signer
                connect(walletType, true);
            }
        };

        const handleChainChanged = () => {
            console.log("Chain changed, reloading...");
            window.location.reload();
        };

        let provider: any;
        if (walletType === "metamask") {
            provider = (window as any).ethereum;
            if (provider?.providers) {
                provider = provider.providers.find((p: any) => p.isMetaMask) || provider;
            }
        } else if (walletType === "kasware") {
            provider = (window as any).kasware;
        }

        if (provider?.on) {
            provider.on("accountsChanged", handleAccountsChanged);
            provider.on("chainChanged", handleChainChanged);
        }

        return () => {
            if (provider?.removeListener) {
                provider.removeListener("accountsChanged", handleAccountsChanged);
                provider.removeListener("chainChanged", handleChainChanged);
            }
        };
    }, [walletType]);

    async function connect(type: WalletType = "metamask", isAuto = false) {
        try {
            if (type === "metamask") {
                let ethereum = (window as any).ethereum;
                
                if (!ethereum) {
                    if (!isAuto) toast.error("No Ethereum wallet found. Please install MetaMask.");
                    return;
                }

                // If multiple providers are present, try to find MetaMask
                if (ethereum?.providers) {
                    ethereum = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum;
                }
                
                console.log("Using provider:", ethereum?.isMetaMask ? "MetaMask" : ethereum?.isKasWare ? "KasWare" : "Unknown");

                if (ethereum?.isKasWare && type === "metamask") {
                    toast.error("KasWare is intercepting the connection. Please disable 'EVM compatibility' in KasWare settings to use MetaMask.");
                }
                
                const accounts = await ethereum.request({ method: "eth_requestAccounts" });
                if (accounts.length > 0) {
                    const newProvider = new BrowserProvider(ethereum);
                    const newSigner = await newProvider.getSigner();
                    setProvider(newProvider);
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
            toast.success(t.walletConnected || "Wallet connected!");
        } catch (e: any) {
            console.error("Connection failed", e);
            if (e.code === 4001 || e.message?.includes("at least one account")) {
                toast.error("Please create an account in your wallet first.");
            } else {
                toast.error("Connection failed. Please try again.");
            }
        }
    }
    
    function disconnect() {
        setSigner(null);
        setProvider(null);
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
                provider,
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
