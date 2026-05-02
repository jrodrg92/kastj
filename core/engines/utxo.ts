/**
 * Abstraction for UTXO-based transaction management.
 * This allows the application to define complex conditional escrow
 * without depending on specific chain APIs or account-based models.
 */

export interface UTXO {
    txId: string;
    outputIndex: number;
    amount: bigint;
    /** Script that locks this UTXO */
    scriptPubKey: string;
    /** Optional address associated with the script */
    address?: string;
}

export interface UTXOScriptConditions {
    /** Minimum threshold reached to allow creator withdrawal */
    minThreshold?: bigint;
    /** Absolute timestamp or block height for expiration */
    lockTime?: number;
    /** List of public keys allowed to sign (for multisig) */
    allowedSigners?: string[];
    /** Number of signatures required */
    requiredSignatures?: number;
}

/**
 * Interface for building Kaspa-native transactions.
 * Implementations will use kaspa-wasm or other SDKs.
 */
export interface UTXOTransactionBuilder {
    /** 
     * Creates a funding transaction that locks funds in an escrow script.
     * The script is derived from the proposal rules.
     */
    buildEscrowLock(
        inputs: UTXO[],
        changeAddress: string,
        recipient: string,
        conditions: UTXOScriptConditions
    ): Promise<string>; // Returns raw hex or signed tx

    /** 
     * Creates a transaction to release funds from escrow.
     */
    buildEscrowRelease(
        escrowUtxos: UTXO[],
        destination: string,
        signatures: string[]
    ): Promise<string>;
}
