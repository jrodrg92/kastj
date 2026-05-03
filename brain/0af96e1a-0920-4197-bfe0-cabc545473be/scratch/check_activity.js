
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function optimize() {
  console.log("Attempting to run optimization SQL via client...");
  
  // We can't run arbitrary SQL via the client unless there is an RPC.
  // But we can try to create the table using the API if it's just about the table.
  // Unfortunately, Supabase API doesn't allow creating tables.
  
  // Let's try to check the current count of activity to see if that's the problem.
  const { count, error } = await supabase
    .from("activity")
    .select("*", { count: "exact", head: true });
  
  if (error) {
    console.error("Error checking activity:", error.message);
  } else {
    console.log("Activity count:", count);
  }
}

optimize();
