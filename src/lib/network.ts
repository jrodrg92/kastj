export const NETWORK = {
  name: "Kasplex Local",
  currency: "KAS",
  isLocal: true,
  explorerUrl: "https://explorer.kasplex.org", // Base URL for the explorer
} as const;

export function amountLabel(amount: string | number) {
  return `${amount} ${NETWORK.currency}`;
}