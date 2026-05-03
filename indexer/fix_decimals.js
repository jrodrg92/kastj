
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDecimals() {
  const { data, error } = await supabase
    .from("proposals")
    .select("id, token, decimals");

  if (error) {
    console.error(error);
    return;
  }

  for (const p of data) {
    const isNative = !p.token || p.token === "0x0000000000000000000000000000000000000000";
    if (isNative && p.decimals !== 18) {
      console.log(`Updating proposal ${p.id} to 18 decimals...`);
      await supabase
        .from("proposals")
        .update({ decimals: 18 })
        .eq("id", p.id);
    }
  }
  console.log("Done!");
}

fixDecimals();
