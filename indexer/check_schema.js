
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data found in proposals table");
  }
}

checkSchema();
