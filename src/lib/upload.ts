import { supabase } from "./supabase-client";

/**
 * Uploads an image to the 'proposals' bucket in Supabase.
 * Returns the public URL of the uploaded file.
 */
export async function uploadProposalImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `covers/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from("proposals")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from("proposals")
    .getPublicUrl(filePath);

  return publicUrl;
}
