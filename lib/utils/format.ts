export function shortAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatGEN(wei: number | bigint): string {
  if (!wei) return "0 GEN";
  const n = Number(wei);
  if (n === 0) return "0 GEN";
  const gen = n / 1e18;
  if (gen < 0.0001) return `${n} wei`;
  if (gen < 1) return `${gen.toFixed(6)} GEN`;
  return `${gen.toFixed(4)} GEN`;
}

export function weiToGEN(wei: number | bigint): number {
  return Number(wei) / 1e18;
}

export function genToWei(gen: number | string): bigint {
  return BigInt(Math.floor(Number(gen) * 1e18));
}

export function explorerTx(hash: string): string {
  return `https://explorer-studio.genlayer.com/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `https://explorer-studio.genlayer.com/address/${addr}`;
}

export function shortAddress4(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatTimestamp(ts: string | number): string {
  if (!ts) return "—";
  const n = typeof ts === "string" ? parseInt(ts) : ts;
  if (n > 1e12) return new Date(n).toLocaleDateString();
  return new Date(n * 1000).toLocaleDateString();
}

export function loanStatusColor(status: string): string {
  const map: Record<string, string> = {
    APPROVED_NOT_DRAWN: "blue",
    ACTIVE: "green",
    PARTIALLY_REPAID: "amber",
    REPAID: "grey",
    OVERDUE: "red",
    DEFAULT_REVIEW: "red",
    DEFAULT_CONFIRMED: "red",
    DISPUTED: "amber",
    CLOSED: "grey",
  };
  return map[status] ?? "grey";
}

export function reviewStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "grey",
    EVALUATING: "amber",
    APPROVED: "green",
    APPROVED_LIMITED: "blue",
    REJECTED: "red",
    MORE_EVIDENCE_REQUIRED: "amber",
    ESCALATED: "red",
  };
  return map[status] ?? "grey";
}
