export const NETWORK = {
  name: "Kasplex Local",
  currency: "KAS",
  isLocal: true,
  explorerUrl: "",
} as const;

export function amountLabel(amount: string | number) {
  return `${amount} ${NETWORK.currency}`;
}