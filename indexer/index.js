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
];

const contract = new ethers.Contract(
  process.env.MANAGER_ADDRESS,
  ABI,
  wallet
);

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

async function autoFinalize() {
  try {
    const now = Math.floor(Date.now() / 1000);

    const { data, error } = await supabase
      .from("proposals")
      .select("id")
      .eq("status", "active")
      .lte("deadline", now);

    if (error) {
      console.error("Auto-finalize fetch error:", error);
      return;
    }

    for (const p of data) {
      try {
        console.log("Auto-finalizing proposal", p.id);

        const tx = await manager.finalize(p.id);
        await tx.wait();

        console.log("Finalized:", p.id);
      } catch (err) {
        console.error("Finalize error for", p.id, err.message);
      }
    }
  } catch (err) {
    console.error("Auto-finalize loop error:", err);
  }
}

setInterval(autoFinalize, 3000); // cada 10 segundos

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

    if (!data || data.length === 0) {
      return;
    }

    for (const proposal of data) {
      try {
        console.log(`Auto-finalizing proposal #${proposal.id}...`);

        const tx = await contract.finalize(proposal.id);
        await tx.wait();

        const success = BigInt(proposal.total_raised) >= BigInt(proposal.goal);

        console.log(
          `Proposal #${proposal.id} finalized as ${
            success ? "succeeded" : "failed"
          }`
        );
      } catch (err) {
        console.error(
          `Auto-finalize failed for proposal #${proposal.id}:`,
          err.message
        );
      }
    }
  } catch (err) {
    console.error("Auto-finalizer loop error:", err.message);
  }
}

setInterval(autoFinalizeExpiredProposals, 10_000);

console.log("Auto-finalizer running every 10 seconds...");