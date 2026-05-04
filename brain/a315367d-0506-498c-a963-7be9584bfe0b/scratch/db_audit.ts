import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "indexer/.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking actual database content...");
  const { data: proposals } = await supabase.from("proposals").select("id, title, tx_hash, status");
  console.log("Proposals in DB:", proposals);
  
  const { data: stats } = await supabase.rpc('get_platform_stats');
  console.log("Stats from RPC:", stats);
}

check().catch(console.error);
