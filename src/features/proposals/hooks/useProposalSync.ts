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
    const metadataUri = proposal?.metadataURI;
    
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
          
          console.log(`[Realtime] Received proposal #${newProposal.id}. Match: ${isMatch}`, { 
            expected: { hash, metadataUri },
            received: { hash: newHash, metadataUri: newMetadataUri }
          });

          if (isMatch && Number(newProposal.id) > 0) {
            console.log(`[Realtime] 🚀 Matching proposal found! Redirecting to /proposal/${newProposal.id}`);
            router.replace(`/proposal/${newProposal.id}`);
            setTimeout(() => { 
              if (window.location.pathname.includes(id as string)) {
                window.location.href = `/proposal/${newProposal.id}`;
              }
            }, 300);
          }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isPending, txHash, proposal?.metadataURI, router, id]);

  // 2. Polling de Redirección (Fallback agresivo)
  useEffect(() => {
    if (!isPending) return;

    const hash = txHash?.toLowerCase().trim();
    const metadataUri = proposal?.metadataURI;

    const checkInterval = setInterval(async () => {
      try {
        // Simple and robust: query by tx_hash or metadata_uri separately if needed
        // but tx_hash is the most reliable link.
        let query = supabase.from("proposals").select("id").gt("id", 0);
        
        // Super aggressive check: Try multiple matchers
        const { data: byHash } = hash 
          ? await supabase.from("proposals").select("id").ilike("tx_hash", hash).gt("id", 0).maybeSingle()
          : { data: null };

        const { data: byMetadata } = metadataUri
          ? await supabase.from("proposals").select("id").eq("metadata_uri", metadataUri).gt("id", 0).maybeSingle()
          : { data: null };

        const foundId = byHash?.id || byMetadata?.id;

        if (foundId) {
          console.log(`[Sync Polling] 🚀 Proposal found! ID: ${foundId}. Redirecting...`);
          router.replace(`/proposal/${foundId}`);
          
          // Force redirect if router hangs
          setTimeout(() => { 
            if (window.location.pathname.includes(id as string)) {
              window.location.href = `/proposal/${foundId}`;
            }
          }, 400);
          
          clearInterval(checkInterval);
          return;
        }
      } catch (err) {
        console.error("[Sync Polling] Critical error:", err);
      }
    }, 2500);

    return () => clearInterval(checkInterval);
  }, [isPending, txHash, proposal?.metadataURI, id, router]);

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
