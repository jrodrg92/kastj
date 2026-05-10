import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupPolicies() {
  console.log("🚀 Setting up Storage Policies...");
  
  // We need to use SQL to create policies as the storage JS client doesn't support them directly
  // However, we can try to do a dummy upload to test.
  
  // Actually, the best way is to tell the user to run the SQL in Supabase dashboard,
  // OR if we have the Postgres connection we could run it.
  
  // Let's just confirm the bucket is public.
  const { data, error } = await supabase.storage.getBucket('proposals');
  console.log("Bucket status:", data);
  
  console.log("\n⚠️ IMPORTANT: You might need to add a 'Public Insert' policy in Supabase Dashboard -> Storage -> Proposals -> Policies");
  console.log("to allow users to upload images.");
}

setupPolicies();
