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
  proposal?: any;
}

/**
 * Hook especializado en la sincronización y reactividad de una propuesta.
 * Maneja la redirección de ID temporal a real y los listeners de Supabase.
 */
export function useProposalSync({ id, proposalId, isPending, txHash, proposal }: UseProposalSyncOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lastKnownTxHash = useRef<string | null>(txHash?.toLowerCase() || null);

  // 1. Redirección Realtime (Cuando una propuesta pendiente es indexada)
  useEffect(() => {
    if (!isPending) return;

    const hash = txHash?.toLowerCase().trim();
    const metadataUri = proposal?.metadata_uri;
    
    const channel = supabase
      .channel(`sync-global-${id}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "proposals"
      }, (payload) => {
          const newProposal = payload.new as any;
          const newHash = newProposal.tx_hash?.toLowerCase().trim();
          const newMetadataUri = newProposal.metadata_uri;
          
          // Coincidencia por Hash O por Metadata URI (infalible)
          const isMatch = (hash && newHash === hash) || (metadataUri && newMetadataUri === metadataUri);

          if (isMatch && Number(newProposal.id) > 0) {
            router.replace(`/proposal/${newProposal.id}`);
            setTimeout(() => { 
              if (window.location.pathname.includes(id as string)) {
                window.location.href = `/proposal/${newProposal.id}`;
              }
            }, 300);
          }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isPending, txHash, proposal?.metadata_uri, router, id]);

  // 2. Polling de Redirección (Fallback agresivo)
  useEffect(() => {
    if (!isPending) return;

    const hash = txHash?.toLowerCase().trim();
    const metadataUri = proposal?.metadata_uri;

    const checkInterval = setInterval(async () => {
      let query = supabase.from("proposals").select("id").gt("id", 0);
      
      if (hash) {
        query = query.or(`tx_hash.eq.${hash}${metadataUri ? `,metadata_uri.eq.${metadataUri}` : ""}`);
      } else if (metadataUri) {
        query = query.eq("metadata_uri", metadataUri);
      } else {
        return; // No hay forma de vincular
      }

      const { data } = await query.maybeSingle();

      if (data?.id) {
        router.replace(`/proposal/${data.id}`);
        setTimeout(() => { 
          if (window.location.pathname.includes(id as string)) {
            window.location.href = `/proposal/${data.id}`;
          }
        }, 300);
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [isPending, txHash, proposal?.metadata_uri, id, router]);

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
