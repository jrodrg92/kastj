
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  // Query information_schema via RPC or just try to get one row
  const tables = ["proposals", "fundings", "activity"];
  
  for (const table of tables) {
    console.log(`--- Table: ${table} ---`);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(1);
    
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No data found");
    }
  }
  
  // Try to see if we can get index info
  const { data: indexes, error: idxError } = await supabase.rpc('get_indexes', { table_name: 'proposals' });
  if (idxError) {
      // If RPC doesn't exist, try another way or just skip
      console.log("RPC get_indexes not found, skipping index check");
  } else {
      console.log("Indexes:", indexes);
  }
}

checkSchema();
