/**
 * Core interface for proposal metadata.
 */
export interface ProposalMetadata {
  title: string;
  description: string;
  image?: string;
}

/**
 * Pure utility to parse metadata from a URI.
 * Supports local:// and supabase:// protocols.
 * Returns null if the URI is invalid or parsing fails.
 */
export function parseMetadataUri(uri: string | undefined | null): ProposalMetadata | null {
  if (!uri) return null;

  // Clean null bytes and whitespace
  const cleanUri = uri.replace(/[\0\u0000]/g, "").trim();
  
  if (!cleanUri.includes("local://") && !cleanUri.includes("supabase://")) {
    return null;
  }

  try {
    const protocol = cleanUri.includes("local://") ? "local://" : "supabase://";
    const raw = cleanUri.split(protocol)[1];
    return JSON.parse(decodeURIComponent(raw)) as ProposalMetadata;
  } catch {
    return null;
  }
}

/**
 * Returns a human-readable status string based on the status code with emoji.
 */
export function statusLabel(status: number | string, t: any) {
  const s = typeof status === "string" ? status : normalizeStatus(status);
  
  if (s === "active") return `🟡 ${t.activeStatus}`;
  if (s === "succeeded") return `🟢 ${t.succeededStatus}`;
  if (s === "failed") return `🔴 ${t.failedStatus}`;
  return `❓ ${t.unknownStatus}`;
}

/**
 * Returns CSS classes for the status badge.
 */
export function statusClass(status: number | string) {
  const s = typeof status === "string" ? status : normalizeStatus(status);

  if (s === "active") return "border border-amber-500/30 bg-amber-500/10 text-amber-400";
  if (s === "succeeded") return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
  if (s === "failed") return "border border-red-500/30 bg-red-500/10 text-red-400";
  return "border border-zinc-500/30 bg-zinc-500/10 text-zinc-400";
}

/**
 * Normalizes numeric or string status to a unified key.
 */
export function normalizeStatus(status: number | string): "active" | "succeeded" | "failed" | "unknown" {
  if (status === 0 || status === "active") return "active";
  if (status === 1 || status === "succeeded") return "succeeded";
  if (status === 2 || status === "failed") return "failed";
  return "unknown";
}

/**
 * Formats a wallet address to a short version.
 */
export function short(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
