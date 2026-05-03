"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { AppHeader } from "@/components/layout/AppHeader";
import { Loader2, CheckCircle2, Clock } from "lucide-react";

export default function TxPage() {
  const { hash } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "confirmed" | "failed">("pending");

  useEffect(() => {
    if (!hash) return;

    // 1. Listen for changes in the activity table for this tx_hash
    const channel = supabase
      .channel("tx-confirmation")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity",
          filter: `tx_hash=eq.${hash}`,
        },
        (payload) => {
          if (payload.new.proposal_id) {
            setStatus("confirmed");
            setTimeout(() => {
              router.push(`/proposal/${payload.new.proposal_id}`);
            }, 1500);
          }
        }
      )
      .subscribe();

    // 2. Initial check in case it's already indexed
    const check = async () => {
      const { data } = await supabase
        .from("activity")
        .select("proposal_id")
        .eq("tx_hash", hash)
        .single();
      
      if (data?.proposal_id) {
        setStatus("confirmed");
        router.push(`/proposal/${data.proposal_id}`);
      }
    };

    check();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hash, router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex h-[70vh] flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-8">
          {status === "pending" ? (
            <>
              <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Loader2 size={40} className="animate-spin" />
              </div>
            </>
          ) : (
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={40} className="animate-bounce" />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          {status === "pending" ? "Confirmando en Blockchain..." : "¡Transacción Confirmada!"}
        </h1>
        
        <div className="mt-6 space-y-2 text-muted-foreground max-w-sm">
          <p>Tu transacción se está procesando en la red Kaspa.</p>
          <p className="text-xs font-mono break-all opacity-50">{hash}</p>
        </div>

        <div className="mt-10 flex items-center gap-3 rounded-full bg-white/[0.03] border border-white/[0.05] px-6 py-3">
          <Clock size={16} className="text-cyan-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-500/80">
            {status === "pending" ? "Sincronizando con el Indexador..." : "Redirigiendo..."}
          </span>
        </div>
      </main>
    </div>
  );
}
