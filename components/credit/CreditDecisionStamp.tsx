import { cn } from "@/lib/utils/cn";
import type { CreditDecision } from "@/lib/genlayer/types";

const DECISION_CONFIG: Record<CreditDecision, { label: string; color: string; bg: string }> = {
  APPROVED_FULL_TERMS: { label: "APPROVED — FULL TERMS", color: "#2E9D68", bg: "rgba(46,157,104,0.08)" },
  APPROVED_LIMITED_CREDIT: { label: "APPROVED — LIMITED", color: "#2E9D68", bg: "rgba(46,157,104,0.08)" },
  APPROVED_WITH_HIGHER_COLLATERAL: { label: "APPROVED — HIGHER COLLATERAL", color: "#F2A93B", bg: "rgba(242,169,59,0.08)" },
  NEEDS_MORE_EVIDENCE: { label: "NEEDS MORE EVIDENCE", color: "#F2A93B", bg: "rgba(242,169,59,0.08)" },
  REJECTED_HIGH_RISK: { label: "REJECTED — HIGH RISK", color: "#C8342D", bg: "rgba(200,52,45,0.08)" },
  REJECTED_INSUFFICIENT_IDENTITY: { label: "REJECTED — IDENTITY", color: "#C8342D", bg: "rgba(200,52,45,0.08)" },
  REJECTED_INCONSISTENT_HISTORY: { label: "REJECTED — INCONSISTENT", color: "#C8342D", bg: "rgba(200,52,45,0.08)" },
  FRAUD_REVIEW_REQUIRED: { label: "FRAUD REVIEW REQUIRED", color: "#C8342D", bg: "rgba(200,52,45,0.1)" },
  HUMAN_REVIEW_REQUIRED: { label: "HUMAN REVIEW REQUIRED", color: "#8B8A84", bg: "rgba(139,138,132,0.1)" },
};

export default function CreditDecisionStamp({
  decision,
  className,
}: {
  decision: CreditDecision;
  className?: string;
}) {
  const config = DECISION_CONFIG[decision] ?? DECISION_CONFIG.NEEDS_MORE_EVIDENCE;
  return (
    <span
      className={cn("stamp", className)}
      style={{ color: config.color, borderColor: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}
