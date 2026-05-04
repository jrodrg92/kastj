"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Wallet, Shield } from "lucide-react";
import { useUi } from "@/contexts/UiContext";

export type TransactionStatus = 
  | { state: "idle" }
  | { state: "signing"; message?: string }
  | { state: "processing"; txHash?: string }
  | { state: "success"; txHash: string; message?: string }
  | { state: "error"; message: string };

export function TransactionOverlay() {
  const { txStatus, setTxStatus } = useUi();

  if (txStatus.state === "idle") return null;

  const isClosable = txStatus.state === "success" || txStatus.state === "error";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="premium-glass w-full max-w-md overflow-hidden rounded-[2.5rem] border-white/10 p-8 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
        >
          <div className="mb-8 flex justify-center">
            {txStatus.state === "signing" && (
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                  <Wallet size={40} />
                </div>
              </div>
            )}
            {txStatus.state === "approving" && (
              <div className="relative">
                <Loader2 size={80} className="animate-spin text-amber-500 opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                  <Shield size={32} className="animate-pulse" />
                </div>
              </div>
            )}
            {txStatus.state === "processing" && (
              <div className="relative">
                <Loader2 size={80} className="animate-spin text-cyan-500 opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center text-cyan-500">
                  <Shield size={32} className="animate-pulse" />
                </div>
              </div>
            )}
            {txStatus.state === "success" && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 size={48} />
              </div>
            )}
            {txStatus.state === "error" && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <XCircle size={48} />
              </div>
            )}
          </div>

          <h3 className="text-2xl font-black tracking-tight text-white">
            {txStatus.state === "signing" && "Awaiting Signature"}
            {txStatus.state === "approving" && "Approving Token Allowance"}
            {txStatus.state === "processing" && "Processing on Blockchain"}
            {txStatus.state === "success" && "Transaction Successful"}
            {txStatus.state === "error" && "Transaction Failed"}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {txStatus.state === "signing" && (txStatus.message || "Please confirm the action in your wallet to proceed.")}
            {txStatus.state === "approving" && "Step 1/2: Allowing Kastj to use your tokens. This is a one-time safety step."}
            {txStatus.state === "processing" && "Step 2/2: Confirming your contribution on-chain."}
            {txStatus.state === "success" && (txStatus.message || "Everything went perfectly! Your contribution is now active.")}
            {txStatus.state === "error" && txStatus.message}
          </p>

          {txStatus.state === "processing" && txStatus.txHash && (
            <div className="mt-6 rounded-2xl bg-white/5 p-3 font-mono text-[10px] text-zinc-500">
              TX: {txStatus.txHash.slice(0, 12)}...{txStatus.txHash.slice(-12)}
            </div>
          )}

          {isClosable && (
            <button
              onClick={() => setTxStatus({ state: "idle" })}
              className="premium-btn mt-8 h-12 w-full rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              Close
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
