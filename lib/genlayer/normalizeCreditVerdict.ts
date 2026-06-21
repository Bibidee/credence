import type { CreditVerdict } from "./types";

export function normalizeCreditVerdict(raw: unknown): CreditVerdict | null {
  if (!raw) return null;
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      decision: data.decision ?? "NEEDS_MORE_EVIDENCE",
      creditTier: data.creditTier ?? "TIER_0_UNREVIEWED",
      recommendedCollateralRatio: Number(data.recommendedCollateralRatio ?? 100),
      maxApprovedAmount: data.maxApprovedAmount ?? data.maxLoanAmount ?? "0 USDC",
      interestRiskBand: data.interestRiskBand ?? "MEDIUM",
      confidence: Number(data.confidence ?? 0),
      repaymentCapacity: data.repaymentCapacity ?? "UNKNOWN",
      identityConfidence: data.identityConfidence ?? "NONE",
      reputationStrength: data.reputationStrength ?? "NONE",
      fraudRisk: data.fraudRisk ?? "MEDIUM",
      reasoning: data.reasoning ?? "",
      termSheet: {
        loanLimit: data.termSheet?.loanLimit ?? "0 USDC",
        minimumCollateral: data.termSheet?.minimumCollateral ?? "0 USDC",
        durationDays: Number(data.termSheet?.durationDays ?? 30),
        repaymentSchedule: data.termSheet?.repaymentSchedule ?? "single repayment at maturity",
        upgradeCondition: data.termSheet?.upgradeCondition ?? "",
        downgradeCondition: data.termSheet?.downgradeCondition ?? "",
      },
      riskNotes: Array.isArray(data.riskNotes) ? data.riskNotes : [],
      privacyNotes: data.privacyNotes ?? "Raw identity documents were not stored on-chain.",
      appealAvailable: data.appealAvailable !== false,
    };
  } catch {
    return null;
  }
}
