import { ethers } from "ethers";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ABI = [
  "event ProposalCreated(uint256 indexed id,address indexed creator,address indexed recipient,uint256 goal,uint256 deadline,string metadataURI)",
  "event ProposalFunded(uint256 indexed id,address indexed supporter,uint256 amount,uint256 totalRaised)",
  "event ProposalFinalized(uint256 indexed id,bool success,uint256 totalRaised)",
];

const contract = new ethers.Contract(
  process.env.MANAGER_ADDRESS,
  ABI,
  provider
);

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

    console.log("Guardada propuesta:", Number(id));
  }
);

contract.on("ProposalFunded", async (id, supporter, amount, totalRaised) => {
  const { error } = await supabase
    .from("proposals")
    .update({
      total_raised: totalRaised.toString(),
    })
    .eq("id", Number(id));

  if (error) {
    console.error("Error actualizando ProposalFunded:", error);
    return;
  }

  console.log("Actualizado funding:", Number(id));
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

  console.log("Finalizada propuesta:", Number(id));
});