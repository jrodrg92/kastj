export function formatRemainingTime(deadlineMs: number) {
  const now = Math.floor(Date.now() / 1000);
  const deadline = Math.floor(deadlineMs / 1000);
  const seconds = deadline - now;

  if (seconds <= 0) return "Expired";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m left`;

  return `${seconds}s left`;
}

export function isExpired(deadlineMs: number) {
  return Date.now() >= deadlineMs;
}