/**
 * Port for wallet connectivity, abstracting away wallet-specific details.
 *
 * Current implementation: MetaMask (EVM/zkEVM) via useLocalWallet.
 * Future implementations:
 * - KaswareWalletAdapter: Kasware browser extension for Kaspa L1
 * - KsprWalletAdapter: KSPR wallet for Kaspa L1
 * - WalletConnectAdapter: Multi-chain via WalletConnect protocol
 */
export interface WalletAdapter {
    /** Unique identifier for this wallet type */
    readonly type: WalletType;

    /** Whether the wallet is currently connected */
    readonly connected: boolean;

    /** The connected account address, if any */
    readonly address: string | undefined;

    /** Connect the wallet. May open a popup or trigger user action. */
    connect(): Promise<void>;

    /** Disconnect the wallet. */
    disconnect(): Promise<void>;

    /**
     * Get a signer for submitting transactions.
     * The return type is `unknown` because different chains use different signer types:
     * - zkEVM: ethers.JsonRpcSigner
     * - Kaspa L1: kaspa-wasm PrivateKey or similar
     * - vProgs: TBD
     */
    getSigner(): unknown | null;

    /**
     * Get the native balance of the connected account.
     * Returns a human-readable decimal string (e.g. "12.5").
     */
    getBalance(): Promise<string>;
}

export type WalletType =
    | "metamask"
    | "kasware"
    | "kspr"
    | "walletconnect"
    | "mock";
