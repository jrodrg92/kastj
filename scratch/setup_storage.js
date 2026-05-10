import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log("🚀 Setting up Supabase Storage...");
  
  const bucketName = "proposals";
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError.message);
    return;
  }
  
  const exists = buckets.find(b => b.name === bucketName);
  
  if (!exists) {
    console.log(`Creating bucket '${bucketName}'...`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError.message);
    } else {
      console.log(`✔️ Bucket '${bucketName}' created successfully.`);
    }
  } else {
    console.log(`✔️ Bucket '${bucketName}' already exists.`);
    
    // Ensure it is public
    if (!exists.public) {
       console.log("Updating bucket to be public...");
       await supabase.storage.updateBucket(bucketName, { public: true });
    }
  }

  console.log("✅ Storage setup complete.");
}

setupStorage();
