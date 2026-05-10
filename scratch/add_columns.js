import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "indexer/.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Adding columns to proposals table...");
  const { error } = await supabase.rpc('exec_sql', { sql: `
    ALTER TABLE proposals ADD COLUMN IF NOT EXISTS summary TEXT;
    ALTER TABLE proposals ADD COLUMN IF NOT EXISTS image_url TEXT;
  ` });

  if (error) {
    console.error("Error adding columns:", error);
  } else {
    console.log("Columns added successfully.");
  }
}

main();
