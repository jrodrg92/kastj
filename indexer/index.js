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
  "event ProposalFunded(uint256 indexed proposalId, address indexed supporter, address indexed token, uint256 amount, uint256 totalRaised)",
  "event ProposalFinalized(uint256 indexed proposalId,uint8 status,uint256 totalRaised)",
  "function finalizeProposal(uint256 proposalId) external",
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256 proposalId) view returns ((uint256 id,address creator,address recipient,address token,uint256 goalAmount,uint256 minThreshold,uint256 deadline,uint256 totalRaised,uint8 status,uint8 settlementMode,bool finalized,string metadataURI))",
];

const contract = new ethers.Contract(
  process.env.MANAGER_ADDRESS,
  ABI,
  wallet
);

const VAULT_ABI = [
  "event Withdrawn(uint256 indexed proposalId,address indexed supporter,address indexed token,uint256 amount)"
];
const VAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

console.log("Indexer manager:", process.env.MANAGER_ADDRESS);
console.log("Indexer signer:", wallet.address);

function statusToText(status) {
  if (Number(status) === 1) return "succeeded";
  if (Number(status) === 2) return "failed";
  return "active";
}

function sanitize(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[\0\u0000]/g, "").trim();
}

function parseMetadata(uri) {
  if (!uri) return { title: "Sin URI", description: "Sin descripción", createdAt: Date.now() };
  
  const cleanUri = sanitize(uri);
  console.log(`Parsing metadata from URI: ${cleanUri.slice(0, 50)}...`);

  if (!cleanUri.includes("local://")) {
    return {
      title: "Formato no soportado",
      description: cleanUri.slice(0, 100),
      createdAt: Date.now(),
    };
  }

  try {
    const decoded = decodeURIComponent(cleanUri);
    const start = decoded.indexOf("{");
    const end = decoded.lastIndexOf("}");
    
    if (start === -1 || end === -1 || end <= start) {
       throw new Error("No JSON structure found in URI");
    }
    
    const jsonPart = decoded.substring(start, end + 1);
    const parsed = JSON.parse(jsonPart);
    
    return {
      title: sanitize(parsed.title) || "Sin título",
      description: sanitize(parsed.description) || "Sin descripción",
      createdAt: parsed.createdAt || Date.now(),
    };
  } catch (e) {
    console.error("Error parsing metadata JSON:", e.message);
    return {
      title: "Error de lectura",
      description: "No se pudo procesar el JSON de la metadata",
      createdAt: Date.now(),
    };
  }
}

async function fetchTokenDecimals(tokenAddress) {
  if (!tokenAddress || tokenAddress === ZERO_ADDRESS) return 18; // Native KAS is 18 on ZK-EVM
  try {
    const token = new ethers.Contract(tokenAddress, ["function decimals() view returns (uint8)"], provider);
    return await token.decimals();
  } catch {
    return 18; // Fallback for other tokens
  }
}

async function saveActivity({ type, proposalId, actor, amount, message, txHash, logIndex }) {
  const activityId = txHash 
    ? `${txHash}_${logIndex || 0}_${type}` 
    : `internal_${type}_${proposalId}_${Date.now()}`;

  const { error } = await supabase.from("activity").upsert({
    id: activityId,
    type,
    proposal_id: proposalId,
    actor,
    amount,
    message,
    created_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  // Cleanup pending transaction if exists
  if (txHash) {
    await supabase.from("pending_transactions").delete().eq("hash", txHash);
  }

  if (error) {
    console.error(`Error saving activity (${type}) for proposal #${proposalId}:`, error.message);
  }
}

async function saveProposalFromChain(proposalId) {
  try {
    const p = await contract.getProposal(proposalId);
  const metadata = parseMetadata(p.metadataURI);
  const decimals = await fetchTokenDecimals(p.token);

  await supabase.from("proposal_metadata").upsert({
    proposal_id: Number(p.id),
    title: sanitize(metadata.title),
    description: sanitize(metadata.description),
    created_at: Number(metadata.createdAt) || Date.now(),
  });

  const { error } = await supabase.from("proposals").upsert({
    id: Number(p.id),
    creator: sanitize(p.creator),
    recipient: sanitize(p.recipient),
    token: sanitize(p.token),
    decimals: decimals,
    goal: p.goalAmount.toString(),
    min_threshold: p.minThreshold.toString(),
    deadline: Number(p.deadline),
    total_raised: p.totalRaised.toString(),
    status: statusToText(p.status),
    settlement_mode: Number(p.settlementMode),
    success: Number(p.status) === 1 ? true : Number(p.status) === 2 ? false : null,
    metadata_uri: sanitize(p.metadataURI),
    title: sanitize(metadata.title),
    description: sanitize(metadata.description),
    created_at: Number(metadata.createdAt) || Date.now(),
  });

  if (error) {
    console.error(`Error guardando proposal #${proposalId}:`, error);
    return;
  }

  console.log("Proposal synced:", Number(proposalId));
  } catch (e) {
    console.error(`[Indexer Error] Failed to sync proposal #${proposalId}:`, e.message);
  }
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
  console.log(`Detected ProposalCreated event for ID: ${Number(proposalId)}`);

  const metadata = parseMetadata(metadataURI);
  const decimals = await fetchTokenDecimals(token);

  await supabase.from("proposal_metadata").upsert({
    proposal_id: Number(proposalId),
    title: sanitize(metadata.title),
    description: sanitize(metadata.description),
    created_at: Number(metadata.createdAt) || Date.now(),
  });

  const { error } = await supabase.from("proposals").upsert({
    id: Number(proposalId),
    creator: sanitize(creator),
    recipient: sanitize(recipient),
    token: sanitize(token),
    decimals: decimals,
    goal: goalAmount.toString(),
    min_threshold: minThreshold.toString(),
    deadline: Number(deadline),
    total_raised: "0",
    status: "active",
    settlement_mode: Number(settlementMode),
    success: null,
    metadata_uri: sanitize(metadataURI),
    title: sanitize(metadata.title),
    description: sanitize(metadata.description),
    created_at: Number(metadata.createdAt) || Date.now(),
  });

  if (error) {
    console.error("Error guardando ProposalCreated:", error);
    return;
  }

  // Cleanup pending version (negative ID) with same tx_hash if it exists
  const txHash = event.transactionHash;
  if (txHash) {
    await supabase.from("proposals")
      .delete()
      .lt("id", 0)
      .eq("tx_hash", txHash);
  }

  await saveActivity({
    type: "created",
    proposalId: Number(proposalId),
    actor: creator,
    amount: null,
    message: `New proposal created #${Number(proposalId)}`,
    txHash: event.transactionHash,
    logIndex: event.index,
  });

  console.log("Proposal created saved:", Number(proposalId));
}

async function handleProposalFunded(event) {
  const { proposalId, supporter, token, amount, totalRaised } = event.args;

  const { error: fundingError } = await supabase.from("fundings").upsert({
    proposal_id: Number(proposalId),
    supporter,
    token,
    amount: amount.toString(),
    tx_hash: event.transactionHash,
    created_at: new Date().toISOString(),
  }, { onConflict: 'tx_hash' });

  if (fundingError) {
    console.error("Error guardando funding:", fundingError.message);
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
    txHash: event.transactionHash,
    logIndex: event.index,
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
    txHash: event.transactionHash,
    logIndex: event.index,
  });

  console.log("Proposal finalized saved:", Number(proposalId));
}

async function handleWithdrawn(event) {
  const { proposalId, supporter, token, amount } = event.args;

  // Mark funding as withdrawn in DB
  const { error } = await supabase
    .from("fundings")
    .update({ withdrawn: true })
    .eq("proposal_id", Number(proposalId))
    .eq("supporter", supporter);

  if (error) {
    console.error("Error marcando funding como retirado:", error);
    return;
  }

  await saveActivity({
    type: "withdrawn",
    proposalId: Number(proposalId),
    actor: supporter,
    amount: amount.toString(),
    message: `Supporter retrieved funds from Proposal #${Number(proposalId)}`,
    txHash: event.transactionHash,
    logIndex: event.index,
  });

  console.log("Withdrawal recorded:", Number(proposalId), "by", supporter);
}

async function getLastSyncedBlock() {
  const { data, error } = await supabase
    .from("sync_state")
    .select("last_block")
    .eq("key", "indexer_last_block")
    .maybeSingle();

  if (error || !data) return null;
  return Number(data.last_block);
}

async function setLastSyncedBlock(blockNumber) {
  await supabase.from("sync_state").upsert({
    key: "indexer_last_block",
    last_block: blockNumber,
    updated_at: new Date().toISOString(),
  });
}

async function pollEvents() {
  const storedBlock = await getLastSyncedBlock();
  const currentBlock = await provider.getBlockNumber();

  // Detect chain reset (common in local dev)
  if (storedBlock !== null && currentBlock < storedBlock) {
    console.warn("⚠️ Blockchain reset detected! Resetting indexer block count to 0...");
    await setLastSyncedBlock(0);
    return; // Restart poll on next loop
  }
  
  // If we have no stored block, start from current - 10000 to catch recent history
  // If we have a stored block, start from there + 1
  let fromBlock = storedBlock ? storedBlock + 1 : Math.max(currentBlock - 10000, 0);
  const toBlock = currentBlock;

  if (fromBlock > toBlock) return;
  
  // Cap the range to prevent overwhelming the provider or DB
  if (toBlock - fromBlock > 5000) {
      console.log(`Large block gap detected (${toBlock - fromBlock}). Syncing in chunks...`);
      fromBlock = toBlock - 5000;
  }

  console.log(`Polling events from block ${fromBlock} to ${toBlock}...`);

  try {
    // 1. Proposal Events
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

    // 2. Vault Events
    const withdrawnEvents = await vaultContract.queryFilter(
      vaultContract.filters.Withdrawn(),
      fromBlock,
      toBlock
    );
    for (const event of withdrawnEvents) {
      await handleWithdrawn(event);
    }

    await setLastSyncedBlock(toBlock);
  } catch (err) {
    console.error("Error during pollEvents:", err.message);
  }
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

// Optimized startup sync
async function syncMissingProposals() {
  const onChainCount = await contract.proposalCount();
  const { count: dbCount } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true });

  console.log(`Sync check: Chain=${onChainCount}, DB=${dbCount || 0}`);

  if (Number(onChainCount) > (dbCount || 0)) {
    console.log("Syncing missing proposals...");
    for (let i = 1; i <= Number(onChainCount); i++) {
      await saveProposalFromChain(i);
    }
    // Update sync state to current block after initial sync
    const currentBlock = await provider.getBlockNumber();
    await setLastSyncedBlock(currentBlock);
    console.log(`Initial sync complete. Synced up to block ${currentBlock}`);
  }
}

// Main Loops
async function main() {
  console.log("Starting Indexer...");

  // Ensure pending_transactions table exists
  try {
    await supabase.rpc('exec_sql', { sql: `
      CREATE TABLE IF NOT EXISTS public.pending_transactions (
        hash TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
      );
      ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Pending') THEN
          CREATE POLICY "Public Read Pending" ON public.pending_transactions FOR SELECT USING (true);
        END IF;
      END $$;
    ` });
  } catch (err) {
    // If RPC exec_sql is not enabled, we assume table is created manually or via other means
    console.log("Note: Initialization check finished. Ensure 'pending_transactions' table exists.");
  }
  
  try {
    await syncMissingProposals();
  } catch (err) {
    console.error("Initial sync failed:", err.message);
  }

  // Usamos solo Polling para evitar errores de FilterId en Ethers v6 con nodos locales/RPCs flacos
  const pollLoop = async () => {
    try {
      await pollEvents();
    } catch (err) {
      console.error("Poll loop error:", err.message);
    }
    setTimeout(pollLoop, 5000); // 5 segundos para que parezca tiempo real sin los errores de listeners
  };

  const finalizeLoop = async () => {
    try {
      await autoFinalizeExpiredProposals();
    } catch (err) {
      console.error("Finalize loop error:", err.message);
    }
    setTimeout(finalizeLoop, 60000); // 1 minute
  };

  pollLoop();
  finalizeLoop();
  
  console.log("Indexer loops and listeners started.");
}

main().catch(err => {
  console.error("Fatal indexer error:", err);
});