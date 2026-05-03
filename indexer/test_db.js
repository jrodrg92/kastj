import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from("proposals").select("*").limit(1);
  
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Connection successful! First proposal:", data[0] || "None");
    
    // Check table structure
    const { data: cols, error: colError } = await supabase.rpc('get_column_info', { table_name: 'proposals' });
    if (colError) {
        console.log("Could not get column info via RPC, trying simple select");
    } else {
        console.log("Columns:", cols);
    }
  }
}

test();
