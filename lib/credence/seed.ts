import type { Borrower, LenderPool, RiskPolicy, CreditReview, Loan, DefaultReview, CreditAppeal } from "@/lib/genlayer/types";

export const SEED_BORROWERS: Borrower[] = [
  {
    id: "borrower_001",
    wallet: "0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0",
    alias: "Adaeze.eth",
    profileHash: "0x3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a",
    currentTier: "TIER_2_LIMITED",
    reviewCount: 1,
    successfulRepayments: 2,
    defaults: 0,
    createdAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "borrower_002",
    wallet: "0xB2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1",
    alias: "Kelechi.sol",
    profileHash: "0x4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b",
    currentTier: "TIER_1_TRIAL",
    reviewCount: 1,
    successfulRepayments: 0,
    defaults: 0,
    createdAt: "2026-04-02T00:00:00Z",
  },
  {
    id: "borrower_003",
    wallet: "0xC3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0C1d2",
    alias: "ToluDAO",
    profileHash: "0x5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c",
    currentTier: "TIER_3_TRUSTED",
    reviewCount: 3,
    successfulRepayments: 5,
    defaults: 0,
    createdAt: "2025-11-20T00:00:00Z",
  },
];

export const SEED_POOLS: LenderPool[] = [
  {
    id: "pool_001",
    owner: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3",
    name: "Grassroots Capital Pool",
    asset: "USDC",
    riskPolicyHash: "0x6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d",
    minimumTier: "TIER_1_TRIAL",
    maxLoanAmount: "2000 USDC",
    maxDurationDays: 60,
    riskAppetite: "BALANCED",
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "pool_002",
    owner: "0xE5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0C1d2E3f4",
    name: "DAO Contributor Fund",
    asset: "USDC",
    riskPolicyHash: "0x7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e",
    minimumTier: "TIER_2_LIMITED",
    maxLoanAmount: "5000 USDC",
    maxDurationDays: 90,
    riskAppetite: "GROWTH",
    createdAt: "2026-02-05T00:00:00Z",
  },
];

export const SEED_POLICIES: RiskPolicy[] = [
  {
    id: "policy_001",
    poolId: "pool_001",
    acceptedEvidenceTypes: ["WALLET_HISTORY_SUMMARY", "PRIOR_REPAYMENT_RECORD", "INCOME_ATTESTATION_HASH"],
    minimumWalletAgeDays: 90,
    minimumRepayments: 0,
    maximumExposurePerBorrower: "2000 USDC",
    allowedLoanPurposes: ["WORKING_CAPITAL", "INVENTORY", "EDUCATION", "FREELANCE_BRIDGE"],
    restrictedLoanPurposes: ["GAMBLING", "SPECULATION", "ILLEGAL_ACTIVITY"],
    collateralBands: {
      TIER_1_TRIAL: { min: 90, max: 100 },
      TIER_2_LIMITED: { min: 60, max: 90 },
      TIER_3_TRUSTED: { min: 35, max: 60 },
    },
    defaultGraceDays: 7,
    appealWindowHours: 72,
    escalationTriggers: ["FRAUD_REVIEW_REQUIRED", "CRITICAL_FRAUD_RISK"],
    plainTextCriteria:
      "Borrowers must have at least 90 days of wallet history. We accept working capital and inventory loans. Collateral requirements are tiered based on reputation. Defaults trigger a 7-day grace period before escalation.",
  },
  {
    id: "policy_002",
    poolId: "pool_002",
    acceptedEvidenceTypes: [
      "WALLET_HISTORY_SUMMARY",
      "DAO_CONTRIBUTION_ATTESTATION",
      "PRIOR_REPAYMENT_RECORD",
      "EMPLOYER_ATTESTATION_HASH",
    ],
    minimumWalletAgeDays: 180,
    minimumRepayments: 1,
    maximumExposurePerBorrower: "5000 USDC",
    allowedLoanPurposes: ["WORKING_CAPITAL", "DAO_PROJECT", "BUSINESS_EXPANSION", "FREELANCE_BRIDGE"],
    restrictedLoanPurposes: ["GAMBLING", "SPECULATION", "ILLEGAL_ACTIVITY", "UNSPECIFIED"],
    collateralBands: {
      TIER_2_LIMITED: { min: 60, max: 90 },
      TIER_3_TRUSTED: { min: 35, max: 60 },
      TIER_4_HIGH_TRUST: { min: 15, max: 35 },
    },
    defaultGraceDays: 5,
    appealWindowHours: 48,
    escalationTriggers: ["FRAUD_REVIEW_REQUIRED", "INCONSISTENT_HISTORY"],
    plainTextCriteria:
      "This pool serves DAO contributors and established freelancers. Borrowers need at least 6 months wallet history and one prior on-chain repayment. DAO attestations are given strong weight. We support growth-stage projects with flexible repayment schedules.",
  },
];

export const SEED_REVIEWS: CreditReview[] = [
  {
    id: "review_001",
    borrowerId: "borrower_001",
    poolId: "pool_001",
    reputationPacketHash: "0x8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f",
    evidenceHash: "0x9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a",
    status: "REVIEWED",
    verdict: {
      decision: "APPROVED_LIMITED_CREDIT",
      creditTier: "TIER_2_LIMITED",
      recommendedCollateralRatio: 65,
      maxApprovedAmount: "500 USDC",
      interestRiskBand: "MEDIUM",
      confidence: 0.78,
      repaymentCapacity: "MODERATE",
      identityConfidence: "HIGH",
      reputationStrength: "MEDIUM",
      fraudRisk: "LOW",
      reasoning:
        "The borrower has a verified wallet history of 420 days, two successful prior repayments, and consistent income attestations. Evidence supports a limited under-collateralized loan. Full approval is not yet warranted because the repayment history is still short and the maximum prior loan was under 300 USDC.",
      termSheet: {
        loanLimit: "500 USDC",
        minimumCollateral: "325 USDC",
        durationDays: 30,
        repaymentSchedule: "Single repayment at maturity",
        upgradeCondition: "Repay on time to qualify for Tier 3 review.",
        downgradeCondition: "Missed repayment or unresolved default.",
      },
      riskNotes: [
        "Short credit history — fewer than 3 repayments",
        "No previous loan above 300 USDC",
        "Income attestation is recent but not long-term",
      ],
      privacyNotes:
        "Raw identity documents were not stored on-chain. Only attestation hashes and summaries were considered.",
      appealAvailable: true,
    },
    createdAt: "2026-05-10T09:00:00Z",
  },
  {
    id: "review_002",
    borrowerId: "borrower_002",
    poolId: "pool_001",
    reputationPacketHash: "0xaf9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b",
    evidenceHash: "0xba0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c",
    status: "UNDER_REVIEW",
    createdAt: "2026-06-18T14:30:00Z",
  },
  {
    id: "review_003",
    borrowerId: "borrower_003",
    poolId: "pool_002",
    reputationPacketHash: "0xcb1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d",
    evidenceHash: "0xdc2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e",
    status: "REVIEWED",
    verdict: {
      decision: "APPROVED_FULL_TERMS",
      creditTier: "TIER_3_TRUSTED",
      recommendedCollateralRatio: 45,
      maxApprovedAmount: "2000 USDC",
      interestRiskBand: "LOW",
      confidence: 0.91,
      repaymentCapacity: "STRONG",
      identityConfidence: "HIGH",
      reputationStrength: "STRONG",
      fraudRisk: "LOW",
      reasoning:
        "ToluDAO has five successful on-chain repayments, verified DAO contribution history, and consistent wallet behaviour over 18 months. The lender policy supports Tier 3 access at 45% collateral. Risk signals are low.",
      termSheet: {
        loanLimit: "2000 USDC",
        minimumCollateral: "900 USDC",
        durationDays: 60,
        repaymentSchedule: "Single repayment at maturity or 2 equal instalments",
        upgradeCondition: "Two more successful repayments qualify for Tier 4 review.",
        downgradeCondition: "Unresolved default or fraud flag triggers tier review.",
      },
      riskNotes: [
        "No concerning patterns identified",
        "Loan purpose aligns with DAO project use case",
      ],
      privacyNotes:
        "Raw identity documents were not stored on-chain. Only attestation hashes and summaries were considered.",
      appealAvailable: false,
    },
    createdAt: "2026-04-22T11:00:00Z",
  },
];

export const SEED_LOANS: Loan[] = [
  {
    id: "loan_001",
    borrowerId: "borrower_001",
    poolId: "pool_001",
    principal: "500 USDC",
    collateral: "325 USDC",
    collateralRatio: 65,
    durationDays: 30,
    status: "ACTIVE",
    createdAt: "2026-05-15T00:00:00Z",
    dueAt: "2026-06-14T00:00:00Z",
  },
  {
    id: "loan_002",
    borrowerId: "borrower_003",
    poolId: "pool_002",
    principal: "1500 USDC",
    collateral: "675 USDC",
    collateralRatio: 45,
    durationDays: 60,
    status: "REPAID",
    createdAt: "2026-03-01T00:00:00Z",
    dueAt: "2026-04-30T00:00:00Z",
  },
];

export const SEED_DEFAULTS: DefaultReview[] = [
  {
    id: "default_001",
    loanId: "loan_001",
    missedDueDate: "2026-06-14T00:00:00Z",
    amountDue: "520 USDC",
    amountPaid: "300 USDC",
    borrowerExplanation:
      "A client payment was delayed by 12 days due to a bank processing issue. Partial repayment of 300 USDC has already been made and the remaining balance will be settled within 7 days.",
    supportingEvidenceHashes: ["0xed3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f"],
    requestedOutcome: "EXTENSION_RECOMMENDED",
    outcome: "EXTENSION_RECOMMENDED",
    reasoning:
      "The borrower has provided a credible explanation supported by partial repayment. A 7-day extension is consistent with the pool's grace period policy. No fraud signals detected.",
    createdAt: "2026-06-15T08:00:00Z",
  },
];

export const SEED_APPEALS: CreditAppeal[] = [
  {
    id: "appeal_001",
    reviewId: "review_001",
    appealReason: "The collateral ratio of 65% was set higher than expected given my repayment history.",
    missingContext:
      "I have an additional employer attestation from a verified issuer that was not included in the original packet.",
    counterEvidenceSummary:
      "New employer attestation hash submitted. Monthly income consistency can now be verified for 12 months rather than 6.",
    requestedOutcome: "COLLATERAL_RATIO_REDUCED",
    additionalEvidenceHashes: ["0xfe4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a"],
    outcome: "COLLATERAL_RATIO_REDUCED",
    reasoning:
      "The appeal introduces a verified 12-month income attestation not present in the original review. The additional context supports a reduction in the recommended collateral ratio from 65% to 55%.",
    status: "REVIEWED",
    createdAt: "2026-05-20T10:00:00Z",
  },
];

export const SEED_STATS = {
  totalReviews: 3,
  approvedCount: 2,
  rejectedCount: 0,
  pendingCount: 1,
  totalLoans: 2,
  totalRepaid: 1,
  totalDefaults: 1,
  totalAppeals: 1,
  appealReversals: 1,
  avgCollateralRatio: 55,
  avgConfidence: 0.845,
  totalBorrowers: 3,
  totalPools: 2,
};
