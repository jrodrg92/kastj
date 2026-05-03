"use client";

import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "../queryKeys";
import { fetchProposal } from "../api";

export function useProposal(id: number) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => fetchProposal(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      // Si no hay datos, reintenta rápido (2s)
      if (!data) return 2000;
      // Si está activa, refresca cada 3s para ver el progreso
      if (data.status === "active" || data.id < 0) return 3000;
      // Si ya terminó, no refresques más
      return false;
    },
  });
}
