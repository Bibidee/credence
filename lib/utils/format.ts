export function shortAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatTier(tier: string): string {
  const map: Record<string, string> = {
    TIER_0_UNREVIEWED: "Tier 0 — Unreviewed",
    TIER_1_TRIAL: "Tier 1 — Trial",
    TIER_2_LIMITED: "Tier 2 — Limited",
    TIER_3_TRUSTED: "Tier 3 — Trusted",
    TIER_4_HIGH_TRUST: "Tier 4 — High Trust",
    TIER_5_INSTITUTIONAL: "Tier 5 — Institutional",
    RESTRICTED: "Restricted",
    DEFAULTED: "Defaulted",
  };
  return map[tier] ?? tier;
}

export function formatDecision(decision: string): string {
  return decision.replace(/_/g, " ");
}

export function pct(value: number): string {
  return `${value}%`;
}
