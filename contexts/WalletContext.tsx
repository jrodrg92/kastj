"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import type { WalletAdapter } from "../core/ports/WalletAdapter";

interface WalletContextState {
    signer: JsonRpcSigner | null;
    address: string | undefined;
    connect: () => Promise<void>;
    disconnect: () => void;
    connected: boolean;
    walletType: WalletAdapter["type"];
}

const WalletContext = createContext<WalletContextState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
    const [address, setAddress] = useState<string | undefined>(undefined);

    // Persist wallet session across reloads if possible, but NOT across tab closes
    useEffect(() => {
        const checkConnection = async () => {
            // Only auto-connect if the user manually connected in this browser session
            if (typeof window !== "undefined" && !sessionStorage.getItem("kastj_wallet_connected")) {
                return;
            }

            const ethereum = (window as unknown as Record<string, unknown>).ethereum as any;
            if (ethereum) {
                try {
                    const accounts = await ethereum.request({ method: "eth_accounts" });
                    if (accounts && accounts.length > 0) {
                        const provider = new BrowserProvider(ethereum);
                        const newSigner = await provider.getSigner();
                        setSigner(newSigner);
                        setAddress(await newSigner.getAddress());
                    }
                } catch (e) {
                    console.debug("Silent wallet reconnect failed", e);
                }
            }
        };
        
        checkConnection();
        
        // Listen to account changes
        const ethereum = (window as unknown as Record<string, unknown>).ethereum as any;
        if (ethereum && ethereum.on) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    checkConnection(); // Re-establish signer with new account
                }
            };
            
            ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, []);

    // Inactivity timeout logic
    useEffect(() => {
        if (!signer) return; // Only track inactivity when connected

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            // 15 minutes of inactivity = 15 * 60 * 1000 = 900000 ms
            timeoutId = setTimeout(() => {
                disconnect();
                console.debug("Wallet disconnected due to inactivity");
            }, 900000); 
        };

        // Initialize timer
        resetTimer();

        // Listen for user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer, { passive: true }));

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [signer]);

    async function connect() {
        const ethereum = (window as unknown as Record<string, unknown>).ethereum as any;

        if (!ethereum) {
            alert("Install MetaMask or a compatible EVM wallet.");
            return;
        }

        await ethereum.request({ method: "eth_requestAccounts" });

        const provider = new BrowserProvider(ethereum);
        const newSigner = await provider.getSigner();

        setSigner(newSigner);
        setAddress(await newSigner.getAddress());
        
        if (typeof window !== "undefined") {
            sessionStorage.setItem("kastj_wallet_connected", "true");
        }
    }
    
    function disconnect() {
        setSigner(null);
        setAddress(undefined);
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("kastj_wallet_connected");
        }
    }

    return (
        <WalletContext.Provider
            value={{
                signer,
                address,
                connect,
                disconnect,
                connected: Boolean(signer),
                walletType: "metamask",
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
