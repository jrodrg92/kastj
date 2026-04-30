"use client";

import { useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { ZkEvmProposalEngine } from "../core/engines/ZkEvmProposalEngine";
import toast from "react-hot-toast";

const engine = new ZkEvmProposalEngine();

export function useKastj(signer: any) {
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);

  async function getProviderOrSigner() {
    if (signer) return signer;

    if (!window.ethereum) {
      throw new Error("No wallet provider found");
    }

    return new BrowserProvider(window.ethereum);
  }

  async function loadProposals() {
    setLoading(true);

    try {
      const providerOrSigner = await getProviderOrSigner();
      const count = await engine.getProposalCount(providerOrSigner);

      const items = [];

      for (let i = 1; i <= Number(count); i++) {
        const p = await engine.getProposal(providerOrSigner, i);

        items.push({
          id: Number(p.id),
          creator: p.creator,
          recipient: p.recipient,
          goal: formatEther(p.goal),
          deadline: Number(p.deadline),
          totalRaised: formatEther(p.totalRaised),
          status: Number(p.status),
          executed: p.executed,
          metadataURI: p.metadataURI,
        });
      }

      setProposals(items);
    } finally {
      setLoading(false);
    }
  }

  async function createProposal(
    recipient: string,
    goalEth: string,
    durationSeconds: number,
    metadataURI: string
  ) {
    if (!signer) throw new Error("Wallet not connected");

    setLoading(true);
    const toastId = toast.loading("Creando propuesta...");

    try {
      await engine.createProposal(
        signer,
        recipient,
        goalEth,
        durationSeconds,
        metadataURI
      );

      toast.success("Propuesta creada 🚀", { id: toastId });
      await loadProposals();
    } catch (e) {
      toast.error("Error al crear propuesta", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function fundProposal(proposalId: number, amountEth: string) {
    if (!signer) throw new Error("Wallet not connected");

    setLoading(true);
    const toastId = toast.loading("Apoyando propuesta...");

    try {
      await engine.fundProposal(signer, proposalId, amountEth);

      toast.success("Apoyo enviado 💸", { id: toastId });
      await loadProposals();
    } catch (e) {
      toast.error("Error al apoyar propuesta", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function finalizeProposal(proposalId: number) {
    if (!signer) throw new Error("Wallet not connected");

    setLoading(true);
    const toastId = toast.loading("Finalizando propuesta...");

    try {
      await engine.finalizeProposal(signer, proposalId);

      toast.success("Propuesta finalizada ✅", { id: toastId });
      await loadProposals();
    } catch (e) {
      toast.error("Error al finalizar propuesta", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function withdraw(proposalId: number) {
    if (!signer) throw new Error("Wallet not connected");

    setLoading(true);
    const toastId = toast.loading("Retirando fondos...");

    try {
      await engine.withdraw(signer, proposalId);

      toast.success("Fondos retirados ✅", { id: toastId });
      await loadProposals();
    } catch (e) {
      toast.error("No se pudo retirar", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return {
    proposals,
    withdraw,
    loading,
    loadProposals,
    createProposal,
    fundProposal,
    finalizeProposal,
  };
}