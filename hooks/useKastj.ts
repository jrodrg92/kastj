"use client";

import { useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { ZkEvmProposalEngine } from "../core/engines/ZkEvmProposalEngine";
import type { Address, ProposalAsset } from "../core/domain/ProposalTypes";
import toast from "react-hot-toast";

const engine = new ZkEvmProposalEngine();

export interface CreateKastjProposalInput {
  recipient: Address;
  asset: ProposalAsset;
  goal: string;
  minThreshold: string;
  durationSeconds: number;
  metadataURI: string;
}

export interface FundKastjProposalInput {
  proposalId: number;
  asset: ProposalAsset;
  amount: string;
}

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
          asset: p.asset,
          goal: formatEther(p.goal),
          minThreshold: formatEther(p.minThreshold),
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

  async function createProposal(input: CreateKastjProposalInput) {
    if (!signer) throw new Error("Wallet not connected");

    setLoading(true);
    const toastId = toast.loading("Creando propuesta...");

    try {
      await engine.createProposal(signer, input);

      toast.success("Propuesta creada 🚀", { id: toastId });
      await loadProposals();
    } catch (e) {
      console.error(e);
      toast.error("Error al crear propuesta", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function fundProposal(input: FundKastjProposalInput) {
    if (!signer) throw new Error("Wallet not connected");

    setLoading(true);
    const toastId =
      input.asset.type === "native"
        ? toast.loading("Apoyando propuesta...")
        : toast.loading("Aprobando token y apoyando propuesta...");

    try {
      await engine.fundProposal(signer, input);

      toast.success("Apoyo enviado 💸", { id: toastId });
      await loadProposals();
    } catch (e) {
      console.error(e);
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
      console.error(e);
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
      console.error(e);
      toast.error("No se pudo retirar", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function withdrawMany(proposalIds: number[]) {
    if (!signer) throw new Error("Wallet not connected");

    setLoading(true);
    const toastId = toast.loading("Retirando fondos disponibles...");

    try {
      await engine.withdrawMany(signer, proposalIds);

      toast.success("Fondos retirados ✅", { id: toastId });
      await loadProposals();
    } catch (e) {
      console.error(e);
      toast.error("Withdraw failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return {
    proposals,
    loading,
    loadProposals,
    createProposal,
    fundProposal,
    finalizeProposal,
    withdraw,
    withdrawMany,
  };
}