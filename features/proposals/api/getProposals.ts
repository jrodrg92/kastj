import { supabase } from "@/lib/supabase";

export async function getProposals() {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw error;

  return data ?? [];
}