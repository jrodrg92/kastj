import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: "indexer/.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSyncState() {
  const { data, error } = await supabase
    .from("sync_state")
    .select("*")
    .eq("key", "indexer_last_block")
    .single();

  if (error) {
    console.error("Error fetching sync state:", error.message);
  } else {
    console.log("Current indexer last block:", data.last_block);
  }
  
  const { count } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true });
    
  console.log("Total proposals in DB:", count);
}

checkSyncState();
