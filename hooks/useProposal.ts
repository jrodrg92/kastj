import { useState, useEffect } from "react";
import { ZkEvmProposalEngine } from "../core/engines/ZkEvmProposalEngine";

const engine = new ZkEvmProposalEngine();

export function useProposal(provider: any, proposalId: number) {
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!provider || !proposalId) return;

    setLoading(true);

    const data = await engine.getProposal(provider, proposalId);

    setProposal(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [provider, proposalId]);

  return {
    proposal,
    loading,
    refresh: load,
  };
}