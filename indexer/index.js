import { ethers } from "ethers";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ABI = [
  "event ProposalCreated(uint256 indexed proposalId,address indexed creator,address indexed recipient,address token,uint256 goalAmount,uint256 minThreshold,uint256 deadline,string metadataURI)",
  "event ProposalFunded(uint256 indexed proposalId,address indexed supporter,address token,uint256 amount,uint256 totalRaised)",
  "event ProposalFinalized(uint256 indexed proposalId,uint8 status,uint256 totalRaised)",
  "function finalizeProposal(uint256 proposalId) external",
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256 proposalId) view returns ((uint256 id,address creator,address recipient,address token,uint256 goalAmount,uint256 minThreshold,uint256 deadline,uint256 totalRaised,uint8 status,bool finalized,string metadataURI))",
];

const contract = new ethers.Contract(
  process.env.MANAGER_ADDRESS,
  ABI,
  wallet
);

console.log("Indexer manager:", process.env.MANAGER_ADDRESS);
console.log("Indexer signer:", wallet.address);

function statusToText(status) {
  if (Number(status) === 1) return "succeeded";
  if (Number(status) === 2) return "failed";
  return "active";
}

function parseMetadata(uri) {
  if (!uri?.startsWith("local://")) {
    return {
      title: "Propuesta sin título",
      description: "Sin descripción",
      createdAt: Date.now(),
    };
  }

  try {
    return JSON.parse(decodeURIComponent(uri.replace("local://", "")));
  } catch {
    return {
      title: "Metadata inválida",
      description: "No se pudo leer la metadata",
      createdAt: Date.now(),
    };
  }
}

async function fetchTokenDecimals(tokenAddress) {
  if (!tokenAddress || tokenAddress === ZERO_ADDRESS) return 18;
  try {
    const token = new ethers.Contract(tokenAddress, ["function decimals() view returns (uint8)"], provider);
    return await token.decimals();
  } catch {
    return 18; // Fallback
  }
}

async function saveActivity({ type, proposalId, actor, amount, message }) {
  const { error } = await supabase.from("activity").insert({
    type,
    proposal_id: proposalId,
    actor,
    amount,
    message,
    created_at: Date.now(),
  });

  if (error) console.error("Error guardando activity:", error);
}

async function saveProposalFromChain(proposalId) {
  const p = await contract.getProposal(proposalId);
  const metadata = parseMetadata(p.metadataURI);
  const decimals = await fetchTokenDecimals(p.token);

  await supabase.from("proposal_metadata").upsert({
    proposal_id: Number(p.id),
    title: metadata.title,
    description: metadata.description,
    created_at: metadata.createdAt,
  });

  const { error } = await supabase.from("proposals").upsert({
    id: Number(p.id),
    creator: p.creator,
    recipient: p.recipient,
    token: p.token,
    decimals: decimals,
    goal: p.goalAmount.toString(),
    min_threshold: p.minThreshold.toString(),
    deadline: Number(p.deadline),
    total_raised: p.totalRaised.toString(),
    status: statusToText(p.status),
    settlement_mode: Number(p.settlementMode),
    success: Number(p.status) === 1 ? true : Number(p.status) === 2 ? false : null,
    metadata_uri: p.metadataURI,
    title: metadata.title,
    description: metadata.description,
    created_at: metadata.createdAt,
  });

  if (error) {
    console.error(`Error guardando proposal #${proposalId}:`, error);
    return;
  }

  console.log("Proposal synced:", Number(proposalId));
}

async function syncExistingProposals() {
  const count = await contract.proposalCount();

  console.log("On-chain proposal count:", count.toString());

  for (let i = 1; i <= Number(count); i++) {
    await saveProposalFromChain(i);
  }
}

async function handleProposalCreated(event) {
  const {
    proposalId,
    creator,
    recipient,
    token,
    goalAmount,
    minThreshold,
    deadline,
    settlementMode,
    metadataURI,
  } = event.args;

  const metadata = parseMetadata(metadataURI);
  const decimals = await fetchTokenDecimals(token);

  await supabase.from("proposal_metadata").upsert({
    proposal_id: Number(proposalId),
    title: metadata.title,
    description: metadata.description,
    created_at: metadata.createdAt,
  });

  const { error } = await supabase.from("proposals").upsert({
    id: Number(proposalId),
    creator,
    recipient,
    token,
    decimals: decimals,
    goal: goalAmount.toString(),
    min_threshold: minThreshold.toString(),
    deadline: Number(deadline),
    total_raised: "0",
    status: "active",
    settlement_mode: Number(settlementMode),
    success: null,
    metadata_uri: metadataURI,
    title: metadata.title,
    description: metadata.description,
    created_at: metadata.createdAt,
  });

  if (error) {
    console.error("Error guardando ProposalCreated:", error);
    return;
  }

  await saveActivity({
    type: "created",
    proposalId: Number(proposalId),
    actor: creator,
    amount: null,
    message: `New proposal created #${Number(proposalId)}`,
  });

  console.log("Proposal created saved:", Number(proposalId));
}

async function handleProposalFunded(event) {
  const { proposalId, supporter, token, amount, totalRaised } = event.args;

  const { error: fundingError } = await supabase.from("fundings").insert({
    proposal_id: Number(proposalId),
    supporter,
    token,
    amount: amount.toString(),
    tx_hash: event.transactionHash,
    created_at: Date.now(),
  });

  if (fundingError) {
    console.error("Error guardando funding:", fundingError);
    return;
  }

  const { error: proposalError } = await supabase
    .from("proposals")
    .update({
      total_raised: totalRaised.toString(),
    })
    .eq("id", Number(proposalId));

  if (proposalError) {
    console.error("Error actualizando ProposalFunded:", proposalError);
    return;
  }

  await saveActivity({
    type: "funded",
    proposalId: Number(proposalId),
    actor: supporter,
    amount: amount.toString(),
    message: `Proposal #${Number(proposalId)} received support`,
  });

  console.log("Funding saved:", Number(proposalId));
}

async function handleProposalFinalized(event) {
  const { proposalId, status, totalRaised } = event.args;
  const textStatus = statusToText(status);

  const { error } = await supabase
    .from("proposals")
    .update({
      total_raised: totalRaised.toString(),
      status: textStatus,
      success: Number(status) === 1,
    })
    .eq("id", Number(proposalId));

  if (error) {
    console.error("Error actualizando ProposalFinalized:", error);
    return;
  }

  await saveActivity({
    type: textStatus,
    proposalId: Number(proposalId),
    actor: null,
    amount: totalRaised.toString(),
    message:
      Number(status) === 1
        ? `Propuesta #${Number(proposalId)} finalizada con éxito`
        : `Propuesta #${Number(proposalId)} falló y permite retiradas`,
  });

  console.log("Proposal finalized saved:", Number(proposalId));
}

let lastBlock = await provider.getBlockNumber();

async function pollEvents() {
  const currentBlock = await provider.getBlockNumber();

  if (currentBlock <= lastBlock) return;

  const fromBlock = lastBlock + 1;
  const toBlock = currentBlock;

  const createdEvents = await contract.queryFilter(
    contract.filters.ProposalCreated(),
    fromBlock,
    toBlock
  );

  for (const event of createdEvents) {
    await handleProposalCreated(event);
  }

  const fundedEvents = await contract.queryFilter(
    contract.filters.ProposalFunded(),
    fromBlock,
    toBlock
  );

  for (const event of fundedEvents) {
    await handleProposalFunded(event);
  }

  const finalizedEvents = await contract.queryFilter(
    contract.filters.ProposalFinalized(),
    fromBlock,
    toBlock
  );

  for (const event of finalizedEvents) {
    await handleProposalFinalized(event);
  }

  lastBlock = currentBlock;
}

async function autoFinalizeExpiredProposals() {
  try {
    const now = Math.floor(Date.now() / 1000);

    const { data, error } = await supabase
      .from("proposals")
      .select("id, deadline, total_raised, goal")
      .eq("status", "active")
      .lte("deadline", now);

    if (error) {
      console.error("Auto-finalizer fetch error:", error);
      return;
    }

    for (const proposal of data ?? []) {
      try {
        console.log(`Auto-finalizing proposal #${proposal.id}...`);

        const tx = await contract.finalizeProposal(proposal.id);
        await tx.wait();

        console.log(`Proposal #${proposal.id} finalized`);
      } catch (err) {
        const msg = err?.shortMessage || err?.message || String(err);

        console.error(`Auto-finalize failed for proposal #${proposal.id}:`, msg);

        if (
          msg.includes("Proposal not found") ||
          msg.includes("Already") ||
          msg.includes("Not active") ||
          msg.includes("require(false)")
        ) {
          await supabase
            .from("proposals")
            .update({ status: "stale" })
            .eq("id", proposal.id);
        }
      }
    }
  } catch (err) {
    console.error("Auto-finalizer loop error:", err?.message || err);
  }
}

await syncExistingProposals();

console.log("Indexer polling events and saving to Supabase...");

setInterval(() => {
  pollEvents().catch((err) => {
    console.error("Poll events error:", err?.message || err);
  });
}, 3000);

setInterval(autoFinalizeExpiredProposals, 10000);

console.log("Auto-finalizer running every 10 seconds...");