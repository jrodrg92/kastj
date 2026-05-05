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
  "event ProposalCreated(uint256 indexed proposalId,address indexed creator,address indexed recipient,address token,uint256 goalAmount,uint256 minThreshold,uint256 deadline,uint8 settlementMode,bool allowOverfunding,string metadataURI,uint8 assetDecimals,uint16 platformFeeBps,uint16 creatorRewardBps,address treasury)",
  "event ProposalFunded(uint256 indexed proposalId, address indexed supporter, address token, uint256 amount, uint256 totalRaised)",
  "event ProposalFinalized(uint256 indexed proposalId,uint8 status,uint256 totalRaised)",
  "function finalizeProposal(uint256 proposalId) external",
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256 proposalId) view returns ((uint256 id,address creator,address recipient,address token,uint256 goalAmount,uint256 minThreshold,uint256 deadline,uint256 totalRaised,uint8 status,uint8 settlementMode,bool finalized,bool allowOverfunding,string metadataURI,uint8 assetDecimals,uint16 platformFeeBps,uint16 creatorRewardBps,address treasury))",
];

const contract = new ethers.Contract(
  process.env.MANAGER_ADDRESS,
  ABI,
  wallet
);

const VAULT_ABI = [
  "event Withdrawn(uint256 indexed proposalId,address indexed supporter,address indexed token,uint256 amount)"
];
const vaultContract = new ethers.Contract(process.env.VAULT_ADDRESS, VAULT_ABI, wallet);

async function checkCode() {
  const code = await provider.getCode(process.env.MANAGER_ADDRESS);
  if (code === "0x" || code === "0x0") {
    console.error("❌ ERROR CRÍTICO: No hay código desplegado en MANAGER_ADDRESS.");
    console.error("👉 Asegúrate de ejecutar: npx hardhat run scripts/deploy.ts --network localhost");
    process.exit(1);
  }
}

checkCode();

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

  // If it's a simple string or doesn't have the local prefix, treat as title/description
  if (!cleanUri.includes("local://")) {
    return {
      title: "Proposal",
      description: cleanUri,
      createdAt: Date.now(),
    };
  }

  try {
    const decoded = decodeURIComponent(cleanUri);
    const start = decoded.indexOf("{");
    const end = decoded.lastIndexOf("}");
    
    if (start === -1 || end === -1 || end <= start) {
       // Fallback for non-JSON URIs
       return {
         title: "Proposal",
         description: decoded.replace("local://", ""),
         createdAt: Date.now()
       };
    }
    
    const jsonPart = decoded.substring(start, end + 1);
    const parsed = JSON.parse(jsonPart);
    
    return {
      title: sanitize(parsed.title) || "Sin título",
      description: sanitize(parsed.description) || "Sin descripción",
      imageUrl: sanitize(parsed.coverImage) || sanitize(parsed.image) || null,
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

async function upsertProposal(proposalId, onChainData = null, txHash = null) {
  try {
    const p = onChainData || (await contract.getProposal(proposalId));
    const cleanMetadataUri = p.metadataURI.replace(/[\0\u0000]/g, "").trim();
    const metadata = parseMetadata(p.metadataURI);
    const decimals = await fetchTokenDecimals(p.token);

    const normalizedCreator = p.creator.toLowerCase();
    const normalizedRecipient = p.recipient.toLowerCase();
    const normalizedToken = p.token.toLowerCase();

    // --- RECONCILIATION ---
    // We look for any "pending" proposal (ID < 0) that matches by TX Hash OR by Metadata URI.
    // We use a normalized version of the URI for comparison.
    let pendingQuery = supabase.from("proposals").select("id, metadata_uri").lt("id", 0);
    
    if (txHash) {
      pendingQuery = pendingQuery.or(`tx_hash.eq.${txHash.toLowerCase()},metadata_uri.ilike.%${cleanMetadataUri.slice(-20)}%`);
    } else {
      pendingQuery = pendingQuery.ilike("metadata_uri", `%${cleanMetadataUri.slice(-20)}%`);
    }

    const { data: pendingItems } = await pendingQuery;
    
    // Additional manual filtering to be 100% sure on URI match
    const matchingPending = pendingItems?.filter(item => {
      const itemUri = (item.metadata_uri || "").replace(/[\0\u0000]/g, "").trim();
      return itemUri === cleanMetadataUri;
    }) || [];

    if (matchingPending.length > 0) {
      console.log(`[Reconciliation] Found ${matchingPending.length} matching pending records for #${proposalId}. Cleaning up...`);
      for (const item of matchingPending) {
        const { error: delError } = await supabase.from("proposals").delete().eq("id", item.id);
        if (delError) console.error(`[Reconciliation] Failed to delete pending #${item.id}:`, delError.message);
      }
    } else {
      console.log(`[Reconciliation] No pending records found for #${proposalId} (Hash: ${txHash?.slice(0, 10)}...)`);
    }

    // --- UPSERT METADATA ---
    await supabase.from("proposal_metadata").upsert({
      proposal_id: Number(p.id),
      title: sanitize(metadata.title),
      description: sanitize(metadata.description),
      created_at: Number(metadata.createdAt) || Date.now(),
    }, { onConflict: 'proposal_id' });

    // --- UPSERT PROPOSAL ---
    const { error } = await supabase.from("proposals").upsert({
      id: Number(p.id),
      creator: normalizedCreator,
      recipient: normalizedRecipient,
      token: normalizedToken,
      decimals: decimals,
      goal: p.goalAmount.toString(),
      min_threshold: p.minThreshold.toString(),
      deadline: Number(p.deadline),
      total_raised: p.totalRaised.toString(),
      status: Number(p.status),
      metadata_uri: cleanMetadataUri,
      tx_hash: txHash,
      title: metadata.title,
      description: metadata.description,
      image_url: metadata.imageUrl || metadata.image || metadata.coverImage
    }, { onConflict: 'id' });

    if (error) {
      console.error(`Error upserting proposal #${proposalId}:`, error.message);
    } else {
      console.log(`Proposal #${proposalId} synced successfully. [${metadata.title}]`);
    }
  } catch (e) {
    console.error(`[Indexer Error] Failed to sync proposal #${proposalId}:`, e.message);
  }
}

async function handleProposalCreated(event) {
  const proposalId = event.args?.proposalId;
  if (proposalId === undefined) {
    console.error(`[Indexer] Could not parse proposalId from event at tx ${event.transactionHash}`);
    return;
  }
  console.log(`[Event] ProposalCreated detected: ID #${Number(proposalId)} | Tx: ${event.transactionHash.slice(0, 10)}...`);
  await upsertProposal(proposalId, null, event.transactionHash);
}

async function handleProposalFunded(event) {
  if (!event.args) {
    console.error(`[Indexer] Could not parse ProposalFunded event args at tx ${event.transactionHash}`);
    return;
  }
  const { proposalId, supporter, token, amount, totalRaised } = event.args;

  const { error: fundingError } = await supabase.from("fundings").upsert({
    proposal_id: Number(proposalId),
    supporter: supporter.toLowerCase(),
    token: token.toLowerCase(),
    amount: amount.toString(),
    tx_hash: event.transactionHash.toLowerCase(),
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
    txHash: event.transactionHash.toLowerCase(),
    logIndex: event.index,
  });

  console.log("Funding saved:", Number(proposalId));
}

async function handleProposalFinalized(event) {
  if (!event.args) {
    console.error(`[Indexer] Could not parse ProposalFinalized event args at tx ${event.transactionHash}`);
    return;
  }
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
    txHash: event.transactionHash.toLowerCase(),
    logIndex: event.index,
  });

  console.log("Proposal finalized saved:", Number(proposalId));
}

async function handleWithdrawn(event) {
  if (!event.args) {
    console.error(`[Indexer] Could not parse Withdrawn event args at tx ${event.transactionHash}`);
    return;
  }
  const { proposalId, supporter, token, amount } = event.args;

  // Mark funding as withdrawn in DB
  const { error } = await supabase
    .from("fundings")
    .update({ withdrawn: true })
    .eq("proposal_id", Number(proposalId))
    .eq("supporter", supporter.toLowerCase());

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
    txHash: event.transactionHash.toLowerCase(),
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
    return;
  }
  
  // Poll from next block
  const fromBlock = storedBlock !== null ? storedBlock + 1 : Math.max(currentBlock - 10, 0);
  const toBlock = currentBlock;

  if (fromBlock > toBlock) {
    // Heartbeat cada 5 segundos si no hay bloques nuevos
    if (Date.now() % 5000 < 1000) {
      console.log(`[Indexer] Idle. Current block: ${currentBlock} | Waiting for block ${fromBlock}...`);
    }
    return;
  }
  
  const finalToBlock = Math.min(toBlock, fromBlock + 5000);
  console.log(`[Indexer] 🔎 Scanning: ${fromBlock} -> ${finalToBlock} (Target: ${currentBlock})`);

  try {
    // 1. Proposal Events
    const createdEvents = await contract.queryFilter(
      "ProposalCreated",
      fromBlock,
      finalToBlock
    );
    for (const event of createdEvents) {
      await handleProposalCreated(event);
    }

    const fundedEvents = await contract.queryFilter(
      "ProposalFunded",
      fromBlock,
      finalToBlock
    );
    for (const event of fundedEvents) {
      await handleProposalFunded(event);
    }

    const finalizedEvents = await contract.queryFilter(
      "ProposalFinalized",
      fromBlock,
      finalToBlock
    );
    for (const event of finalizedEvents) {
      await handleProposalFinalized(event);
    }

    // 2. Vault Events
    const withdrawnEvents = await vaultContract.queryFilter(
      "Withdrawn",
      fromBlock,
      finalToBlock
    );
    for (const event of withdrawnEvents) {
      await handleWithdrawn(event);
    }

    await setLastSyncedBlock(finalToBlock);
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
  
  // Si la cadena tiene 0 propuestas (recién reiniciada), pero la DB tiene datos,
  // probablemente necesitemos limpiar la DB o ignorar el desajuste.
  if (Number(onChainCount) === 0) {
    console.log("Chain is empty. Resetting indexer last block to 0.");
    await setLastSyncedBlock(0);
    return;
  }

  const { count: dbCount } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true })
    .gt("id", 0);

  console.log(`Sync check: Chain=${onChainCount}, DB=${dbCount || 0}`);

  if (Number(onChainCount) > (dbCount || 0)) {
    console.log("Syncing missing proposals...");
    for (let i = 1; i <= Number(onChainCount); i++) {
      await upsertProposal(i);
    }
    console.log(`Initial sync complete. Processed ${onChainCount} proposals.`);
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
      console.error("❌ Poll loop error:", err.message);
    } finally {
      // Ensure the loop ALWAYS continues, even if pollEvents hangs or fails
      setTimeout(pollLoop, 1000);
    }
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
  
  // High-frequency reconciliation loop (every 5 seconds)
  // This catches any missed events by comparing proposalCount vs DB count
  const reconciliationLoop = async () => {
    try {
      await syncMissingProposals();
    } catch (err) {
      console.error("Reconciliation loop error:", err.message);
    }
    setTimeout(reconciliationLoop, 5000);
  };
  reconciliationLoop();
  
  console.log("Indexer loops and listeners started.");
}

main().catch(err => {
  console.error("Fatal indexer error:", err);
});