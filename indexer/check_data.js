
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  const { data, error } = await supabase
    .from("proposals")
    .select("id, total_raised, token")
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }

  for (const p of data) {
    console.log(`Proposal #${p.id}: raised=${p.total_raised}, token=${p.token}`);
  }
}

checkData();
