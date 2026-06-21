import type { CreditTier } from "@/lib/genlayer/types";
import { cn } from "@/lib/utils/cn";

const TIER_CONFIG: Record<CreditTier, { label: string; color: string; bg: string; border: string }> = {
  TIER_0_UNREVIEWED: { label: "TIER 0", color: "#8B8A84", bg: "rgba(139,138,132,0.08)", border: "rgba(139,138,132,0.2)" },
  TIER_1_TRIAL: { label: "TIER 1 — TRIAL", color: "#8B8A84", bg: "rgba(139,138,132,0.08)", border: "rgba(139,138,132,0.25)" },
  TIER_2_LIMITED: { label: "TIER 2 — LIMITED", color: "#2457FF", bg: "rgba(36,87,255,0.06)", border: "rgba(36,87,255,0.2)" },
  TIER_3_TRUSTED: { label: "TIER 3 — TRUSTED", color: "#D6A84F", bg: "rgba(214,168,79,0.08)", border: "rgba(214,168,79,0.3)" },
  TIER_4_HIGH_TRUST: { label: "TIER 4 — HIGH TRUST", color: "#D6A84F", bg: "rgba(214,168,79,0.12)", border: "#D6A84F" },
  TIER_5_INSTITUTIONAL: { label: "TIER 5 — INSTITUTIONAL", color: "#15130F", bg: "#D6A84F", border: "#D6A84F" },
  RESTRICTED: { label: "RESTRICTED", color: "#C8342D", bg: "rgba(200,52,45,0.08)", border: "rgba(200,52,45,0.3)" },
  DEFAULTED: { label: "DEFAULTED", color: "#C8342D", bg: "rgba(200,52,45,0.1)", border: "#C8342D" },
};

export default function CreditTierBadge({ tier, className }: { tier: CreditTier; className?: string }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.TIER_0_UNREVIEWED;
  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-1 border text-[10px] font-financial uppercase tracking-widest font-bold", className)}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}
