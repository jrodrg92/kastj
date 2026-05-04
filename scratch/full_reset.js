import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "indexer/.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fullReset() {
  console.log("🚀 Starting full reset...");
  
  // 1. Reset indexer block
  const { error: err1 } = await supabase.from("sync_state").upsert({
    key: "indexer_last_block",
    last_block: 0,
    updated_at: new Date().toISOString(),
  });
  if (err1) console.error("Error resetting block:", err1.message);
  else console.log("✔️ Indexer block reset to 0");

  // 2. Clear proposals
  const { error: err2 } = await supabase.from("proposals").delete().neq("id", 0);
  if (err2) console.error("Error clearing proposals:", err2.message);
  else console.log("✔️ Proposals cleared");

  // 3. Clear activities
  const { error: err3 } = await supabase.from("activity").delete().neq("id", "0");
  if (err3) console.error("Error clearing activity:", err3.message);
  else console.log("✔️ Activity cleared");

  // 4. Clear fundings
  const { error: err4 } = await supabase.from("fundings").delete().neq("proposal_id", 0);
  if (err4) console.error("Error clearing fundings:", err4.message);
  else console.log("✔️ Fundings cleared");

  console.log("✅ Reset complete. Please restart the indexer.");
}

fullReset();
