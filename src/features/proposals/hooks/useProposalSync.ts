"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { proposalKeys } from "../queryKeys";

interface UseProposalSyncOptions {
  id: string | string[];
  proposalId: number;
  isPending: boolean;
  txHash?: string | null;
}

/**
 * Hook especializado en la sincronización y reactividad de una propuesta.
 * Maneja la redirección de ID temporal a real y los listeners de Supabase.
 */
export function useProposalSync({ id, proposalId, isPending, txHash }: UseProposalSyncOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lastKnownTxHash = useRef<string | null>(txHash?.toLowerCase() || null);

  // 1. Redirección Realtime (Cuando una propuesta pendiente es indexada)
  useEffect(() => {
    if (!isPending || !txHash) return;

    const hash = txHash.toLowerCase();
    const channel = supabase
      .channel(`sync-${hash}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals", filter: `tx_hash=eq.${hash}` },
        (payload) => {
          const newProposal = payload.new as any;
          if (newProposal && Number(newProposal.id) > 0) {
            router.replace(`/proposal/${newProposal.id}`);
            setTimeout(() => { 
              if (window.location.pathname.includes(id as string)) {
                window.location.href = `/proposal/${newProposal.id}`;
              }
            }, 500);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isPending, txHash, router, id]);

  // 2. Polling de Redirección (Fallback por si falla Realtime)
  useEffect(() => {
    if (!isPending || !txHash) return;

    const checkInterval = setInterval(async () => {
      const hash = txHash.toLowerCase();
      const { data } = await supabase
        .from("proposals")
        .select("id")
        .gt("id", 0)
        .eq("tx_hash", hash)
        .maybeSingle();

      if (data?.id) {
        router.replace(`/proposal/${data.id}`);
        setTimeout(() => { 
          if (window.location.pathname.includes(id as string)) {
            window.location.href = `/proposal/${data.id}`;
          }
        }, 500);
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [isPending, txHash, id, router]);

  // 3. Reactividad de Datos (Actualizar caché de React Query en tiempo real)
  useEffect(() => {
    if (isPending || proposalId <= 0) return;

    const channel = supabase
      .channel(`proposal-room-${proposalId}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "proposals", 
        filter: `id=eq.${proposalId}` 
      }, () => { 
        queryClient.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) }); 
      })
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "fundings", 
        filter: `proposal_id=eq.${proposalId}` 
      }, () => { 
        queryClient.invalidateQueries({ queryKey: ["fundings", proposalId] });
        queryClient.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) });
      })
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "activity", 
        filter: `proposal_id=eq.${proposalId}` 
      }, () => { 
        queryClient.invalidateQueries({ queryKey: ["activity", proposalId] }); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isPending, proposalId, queryClient]);
}
