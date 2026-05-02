import { ethers } from "ethers";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ABI = [
  "event ProposalCreated(uint256 indexed id,address indexed creator,address indexed recipient,uint256 goal,uint256 deadline,string metadataURI)",
  "event ProposalFunded(uint256 indexed id,address indexed supporter,uint256 amount,uint256 totalRaised)",
  "event ProposalFinalized(uint256 indexed id,bool success,uint256 totalRaised)",
  "function finalize(uint256 id) external",
  "function proposalCount() view returns (uint256)",
];

const contract = new ethers.Contract(
  process.env.MANAGER_ADDRESS,
  ABI,
  wallet
);

console.log("Indexer manager:", process.env.MANAGER_ADDRESS);
console.log("Indexer signer:", wallet.address);

const count = await contract.proposalCount();
console.log("On-chain proposal count:", count.toString());

async function saveActivity({ type, proposalId, actor, amount, message }) {
  const { error } = await supabase.from("activity").insert({
    type,
    proposal_id: proposalId,
    actor,
    amount,
    message,
    created_at: Date.now(),
  });

  if (error) {
    console.error("Error guardando activity:", error);
  }
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

console.log("Indexer escuchando y guardando en Supabase...");

contract.on(
  "ProposalCreated",
  async (id, creator, recipient, goal, deadline, metadataURI) => {
    const metadata = parseMetadata(metadataURI);

    await supabase.from("proposal_metadata").upsert({
      proposal_id: Number(id),
      title: metadata.title,
      description: metadata.description,
      created_at: metadata.createdAt,
    });

    const { error } = await supabase.from("proposals").upsert({
      id: Number(id),
      creator,
      recipient,
      goal: goal.toString(),
      deadline: Number(deadline),
      total_raised: "0",
      status: "active",
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
      proposalId: Number(id),
      actor: creator,
      amount: null,
      message: `New proposal created #${Number(id)}`,
    });

    console.log("Save proposal:", Number(id));
  }
);

contract.on("ProposalFunded", async (id, supporter, amount, totalRaised) => {
  const proposalId = Number(id);

  const { error: fundingError } = await supabase.from("fundings").insert({
    proposal_id: proposalId,
    supporter,
    amount: amount.toString(),
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
    .eq("id", proposalId);

  if (proposalError) {
    console.error("Error actualizando ProposalFunded:", proposalError);
    return;
  }

  await saveActivity({
    type: "funded",
    proposalId: proposalId,
    actor: supporter,
    amount: amount.toString(),
    message: `Proposal #${proposalId} received support`,
  });

  console.log("Funding guardado:", proposalId);
});

contract.on("ProposalFinalized", async (id, success, totalRaised) => {
  const { error } = await supabase
    .from("proposals")
    .update({
      total_raised: totalRaised.toString(),
      status: success ? "succeeded" : "failed",
      success,
    })
    .eq("id", Number(id));

  if (error) {
    console.error("Error actualizando ProposalFinalized:", error);
    return;
  }

  await saveActivity({
    type: success ? "succeeded" : "failed",
    proposalId: Number(id),
    actor: null,
    amount: totalRaised.toString(),
    message: success
      ? `Propuesta #${Number(id)} finalizada con éxito`
      : `Propuesta #${Number(id)} falló y permite retiradas`,
  });

  console.log("Finalizada propuesta:", Number(id));
});

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

        const tx = await contract.finalize(proposal.id);
        await tx.wait();

        console.log(`Proposal #${proposal.id} finalized`);
      } catch (err) {
        const msg = err?.shortMessage || err?.message || String(err);

        console.error(`Auto-finalize failed for proposal #${proposal.id}:`, msg);

        if (
          msg.includes("Proposal not found") ||
          msg.includes("Already") ||
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

setInterval(autoFinalizeExpiredProposals, 10000);
console.log("Auto-finalizer running every 10 seconds...");
