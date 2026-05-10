import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "indexer/.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reset() {
  console.log("Resetting database state to match new blockchain...");
  
  const tables = ["activity", "fundings", "proposal_metadata", "sync_state", "proposals"];
  
  for (const table of tables) {
    console.log(`Clearing table: ${table}`);
    const { error } = await supabase.from(table).delete().neq("id", -999999); // delete everything
    if (error) console.error(`Error clearing ${table}:`, error.message);
  }

  console.log("Database reset complete. Indexer should now sync from scratch.");
}

reset().catch(console.error);
