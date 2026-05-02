"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocalWallet } from "../hooks/useLocalWallet";
import { useKastj } from "../hooks/useKastj";
import { useSupabaseProposals } from "../hooks/useSupabaseProposals";
import { useUserDashboard } from "../hooks/useUserDashboard";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { StatsBar } from "../components/dashboard/StatsBar";
import { CreateProposalForm } from "../components/proposal/CreateProposalForm";
import { ProposalCard } from "../components/proposal/ProposalCard";
import { UserDashboard } from "../components/dashboard/UserDashboard";
import { ActivityFeed } from "../components/activity/ActivityFeed";
import { NETWORK } from "../lib/network";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
import { AppHeader } from "../components/layout/AppHeader";
import { isAddress } from "ethers";
import type { Address } from "../core/domain/ProposalTypes";

type Filter =
  | "all"
  | "active"
  | "mine"
  | "supported"
  | "succeeded"
  | "failed";

type Sort = "newest" | "raised" | "ending";

function metadataText(metadataURI?: string) {
  if (!metadataURI?.startsWith("local://")) return "";

  try {
    const metadata = JSON.parse(
      decodeURIComponent(metadataURI.replace("local://", ""))
    );

    return `${metadata.title ?? ""} ${metadata.description ?? ""}`.toLowerCase();
  } catch {
    return "";
  }
}

export default function HomePage() {
  const wallet = useLocalWallet();
  const kastj = useKastj(wallet.signer);
  const db = useSupabaseProposals();
  const feed = useActivityFeed();

  const proposals = db.dbProposals ?? [];

  const [filter, setFilter] = useState<Filter>("all");
  const [supportedIds, setSupportedIds] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("10000");
  const [fundAmount, setFundAmount] = useState("1");

  const { t } = useLanguage();
  const userDashboard = useUserDashboard(wallet.address);

  const [minThreshold, setMinThreshold] = useState("100");
  const [durationSeconds, setDurationSeconds] = useState(86400);

  // ✅ HANDLERS FIX
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch((e.target as HTMLInputElement).value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort((e.target as HTMLSelectElement).value as Sort);
  };

  const handleFundAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFundAmount((e.target as HTMLInputElement).value);
  };

  const supportedIdsSet = useMemo(() => {
    return new Set(userDashboard.dashboard.supportedIds ?? supportedIds);
  }, [userDashboard.dashboard.supportedIds, supportedIds]);

  const filteredProposals = proposals
    .filter((proposal) => {
      if (filter === "active" && proposal.status !== 0) return false;

      if (filter === "mine") {
        return (
          proposal.creator.toLowerCase() ===
          wallet.address?.toLowerCase()
        );
      }

      if (filter === "supported") {
        return supportedIdsSet.has(proposal.id);
      }

      if (filter === "succeeded" && proposal.status !== 1) return false;
      if (filter === "failed" && proposal.status !== 2) return false;

      if (!search.trim()) return true;

      return metadataText(proposal.metadataURI).includes(
        search.toLowerCase().trim()
      );
    })
    .sort((a, b) => {
      if (sort === "raised") {
        return Number(b.totalRaised) - Number(a.totalRaised);
      }

      if (sort === "ending") {
        return Number(a.deadline) - Number(b.deadline);
      }

      return Number(b.id) - Number(a.id);
    });

  async function loadMySupportedProposals() {
    if (!wallet.address) return;

    const { data } = await supabase
      .from("fundings")
      .select("proposal_id")
      .eq("supporter", wallet.address);

    const ids = Array.from(
      new Set((data ?? []).map((item) => Number(item.proposal_id)))
    );

    setSupportedIds(ids);
  }

  useEffect(() => {
    if (wallet.connected) {
      db.loadDbProposals();
      loadMySupportedProposals();
    }
  }, [wallet.connected, wallet.address]);

  async function refreshDbSoon() {
    await new Promise((r) => setTimeout(r, 800));
    await db.loadDbProposals();
  }

  async function handleCreate() {
    if (!title || !description) {
      toast.error("Añade título y descripción");
      return;
    }

    if (!isAddress(recipient)) {
      toast.error("Dirección inválida");
      return;
    }

    await kastj.createProposal({
      recipient: recipient as Address,
      asset: { type: "native" },
      goal,
      minThreshold,
      durationSeconds,
      metadataURI: `local://${encodeURIComponent(
        JSON.stringify({ title, description })
      )}`,
    });

    await refreshDbSoon();
  }

  async function handleFinalize(id: number) {
    await kastj.finalizeProposal(id);
    await refreshDbSoon();
  }

  async function handleWithdraw(id: number) {
    await kastj.withdraw(id);
    await refreshDbSoon();
  }

  async function handleFund(id: number) {
    const proposal = proposals.find((p) => p.id === id);

    if (!proposal) {
      toast.error("Propuesta no encontrada");
      return;
    }

    await kastj.fundProposal({
      proposalId: id,
      asset: proposal.asset,
      amount: fundAmount,
    });

    await refreshDbSoon();
  }

  async function handleWithdrawAll(ids: number[]) {
    if (!ids.length) return;

    await kastj.withdrawMany(ids);
    await refreshDbSoon();
  }

  return (
    <main className="p-6 text-white">
      <AppHeader
        connected={wallet.connected}
        address={wallet.address}
        connect={wallet.connect}
        signer={wallet.signer}
      />

      <StatsBar proposals={proposals} />

      {wallet.connected && (
        <UserDashboard
          dashboard={userDashboard.dashboard}
          loading={userDashboard.loadingUserDashboard}
          onWithdrawAll={handleWithdrawAll}
        />
      )}

      <input value={search} onChange={handleSearchChange} />

      <select value={sort} onChange={handleSortChange}>
        <option value="newest">Newest</option>
        <option value="raised">Most funded</option>
        <option value="ending">Ending soon</option>
      </select>

      <input value={fundAmount} onChange={handleFundAmountChange} />

      {filteredProposals.map((p) => (
        <ProposalCard
          key={p.id}
          proposal={p}
          fundAmount={fundAmount}
          loading={kastj.loading}
          connected={wallet.connected}
          isSupported={supportedIdsSet.has(p.id)}
          onFund={handleFund}
          onFinalize={handleFinalize}
          onWithdraw={handleWithdraw}
        />
      ))}
    </main>
  );
}