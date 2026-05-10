"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Wallet, Shield, ExternalLink } from "lucide-react";
import { useUi } from "@/contexts/UiContext";
import { TransactionStepper } from "./TransactionStepper";
import { NETWORK } from "@/lib/network";

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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="premium-glass w-full max-w-2xl overflow-hidden rounded-[2.5rem] border-white/10 p-10 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]"
        >
          {/* Top Status Header */}
          <div className="mb-10 flex flex-col items-center">
             <div className="mb-6 flex justify-center">
                {txStatus.state === "signing" && (
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                      <Wallet size={48} />
                    </div>
                  </div>
                )}
                {txStatus.state === "processing" && (
                  <div className="relative">
                    <Loader2 size={96} className="animate-spin text-cyan-500 opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-500">
                      <Shield size={40} className="animate-pulse" />
                    </div>
                  </div>
                )}
                {txStatus.state === "success" && (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 size={64} />
                  </div>
                )}
                {txStatus.state === "error" && (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                    <XCircle size={64} />
                  </div>
                )}
              </div>

              <h3 className="text-3xl font-black tracking-tight text-white mb-2">
                {txStatus.state === "signing" && "Secure Signing"}
                {txStatus.state === "processing" && "On-Chain Validation"}
                {txStatus.state === "success" && "Transaction Verified"}
                {txStatus.state === "error" && "Transaction Failed"}
              </h3>
              
              <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                {txStatus.state === "signing" && (txStatus.message || "Please approve the transaction in your connected wallet.")}
                {txStatus.state === "processing" && "We are broadcasting your transaction. Please do not close this window."}
                {txStatus.state === "success" && (txStatus.message || "Your contribution has been successfully confirmed and verified.")}
                {txStatus.state === "error" && txStatus.message}
              </p>
          </div>

          {/* Stepper Logic (Phase 2) */}
          <div className="mb-10 rounded-3xl bg-white/5 p-8 border border-white/5">
             <TransactionStepper 
                currentStep={(txStatus as any).step || "review"} 
                status={txStatus.state as any} 
             />
          </div>

          {/* Transaction Hash */}
          {txStatus.state !== "signing" && (txStatus as any).txHash && (
            <div className="mb-8 flex flex-col items-center gap-3">
               <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/50 px-4 py-2 border border-white/5">
                  <span className="font-mono text-[10px] text-zinc-500">
                    {(txStatus as any).txHash}
                  </span>
                  <a 
                    href={`${NETWORK.explorerUrl}/tx/${(txStatus as any).txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
               </div>
            </div>
          )}

          {/* Action Button */}
          {isClosable && (
            <button
              onClick={() => setTxStatus({ state: "idle" })}
              className="premium-btn h-14 w-full max-w-xs rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-cyan-500/10"
            >
              Close Overlay
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
