export interface RawProposal {
  id: number | string;
  creator: string;
  recipient: string;
  token: string | null;
  decimals: number | string | null;
  goal: string | null;
  min_threshold: string | null;
  total_raised: string | null;
  deadline: number | string | null;
  status: string | number | null;
  metadata_uri: string | null;
  tx_hash: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  token_symbol?: string | null;
}
