export type CreditDecision =
  | "APPROVED_FULL_TERMS"
  | "APPROVED_LIMITED_CREDIT"
  | "APPROVED_WITH_HIGHER_COLLATERAL"
  | "NEEDS_MORE_EVIDENCE"
  | "REJECTED_HIGH_RISK"
  | "REJECTED_INSUFFICIENT_IDENTITY"
  | "REJECTED_INCONSISTENT_HISTORY"
  | "FRAUD_REVIEW_REQUIRED"
  | "HUMAN_REVIEW_REQUIRED";

export type CreditTier =
  | "TIER_0_UNREVIEWED"
  | "TIER_1_TRIAL"
  | "TIER_2_LIMITED"
  | "TIER_3_TRUSTED"
  | "TIER_4_HIGH_TRUST"
  | "TIER_5_INSTITUTIONAL"
  | "RESTRICTED"
  | "DEFAULTED";

export type RepaymentCapacity = "UNKNOWN" | "LOW" | "MODERATE" | "STRONG" | "VERY_STRONG";
export type IdentityConfidence = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type ReputationStrength = "NONE" | "WEAK" | "MEDIUM" | "STRONG" | "EXCELLENT";
export type FraudRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InterestRiskBand = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type DefaultReviewOutcome =
  | "DEFAULT_CONFIRMED"
  | "EXTENSION_RECOMMENDED"
  | "PARTIAL_REPAYMENT_PLAN"
  | "RESTRUCTURE_RECOMMENDED"
  | "BORROWER_EXPLANATION_ACCEPTED"
  | "FRAUD_REVIEW_REQUIRED"
  | "LENDER_ERROR"
  | "NEEDS_MORE_CONTEXT";

export type AppealOutcome =
  | "UPHELD"
  | "TIER_UPGRADED"
  | "TIER_DOWNGRADED"
  | "COLLATERAL_RATIO_REDUCED"
  | "COLLATERAL_RATIO_INCREASED"
  | "REVIEW_AGAIN_WITH_MORE_EVIDENCE"
  | "ESCALATED_TO_HUMAN";

export interface CreditTermSheet {
  loanLimit: string;
  minimumCollateral: string;
  durationDays: number;
  repaymentSchedule: string;
  upgradeCondition: string;
  downgradeCondition: string;
}

export interface CreditVerdict {
  decision: CreditDecision;
  creditTier: CreditTier;
  recommendedCollateralRatio: number;
  maxApprovedAmount: string;
  interestRiskBand: InterestRiskBand;
  confidence: number;
  repaymentCapacity: RepaymentCapacity;
  identityConfidence: IdentityConfidence;
  reputationStrength: ReputationStrength;
  fraudRisk: FraudRisk;
  reasoning: string;
  termSheet: CreditTermSheet;
  riskNotes: string[];
  privacyNotes: string;
  appealAvailable: boolean;
}

export type CreditReviewStatus = "SUBMITTED" | "UNDER_REVIEW" | "REVIEWED" | "APPEALED" | "CLOSED";
export type LoanStatus = "ACTIVE" | "REPAID" | "LATE" | "DEFAULT_REVIEW" | "DEFAULTED" | "RESTRUCTURED";
export type RiskAppetite = "CONSERVATIVE" | "BALANCED" | "GROWTH" | "EXPERIMENTAL";

export interface Borrower {
  id: string;
  wallet: string;
  alias: string;
  profileHash: string;
  currentTier: CreditTier;
  reviewCount: number;
  successfulRepayments: number;
  defaults: number;
  createdAt: string;
}

export interface LenderPool {
  id: string;
  owner: string;
  name: string;
  asset: string;
  riskPolicyHash: string;
  minimumTier: CreditTier;
  maxLoanAmount: string;
  maxDurationDays: number;
  riskAppetite: RiskAppetite;
  createdAt: string;
}

export interface RiskPolicy {
  id: string;
  poolId: string;
  acceptedEvidenceTypes: string[];
  minimumWalletAgeDays: number;
  minimumRepayments: number;
  maximumExposurePerBorrower: string;
  allowedLoanPurposes: string[];
  restrictedLoanPurposes: string[];
  collateralBands: Record<string, { min: number; max: number }>;
  defaultGraceDays: number;
  appealWindowHours: number;
  escalationTriggers: string[];
  plainTextCriteria: string;
}

export interface CreditReview {
  id: string;
  borrowerId: string;
  poolId: string;
  reputationPacketHash: string;
  evidenceHash: string;
  status: CreditReviewStatus;
  verdict?: CreditVerdict;
  createdAt: string;
  reputationPacket?: ReputationPacket;
}

export interface ReputationPacket {
  reviewId: string;
  borrowerId: string;
  poolId: string;
  walletAddress: string;
  requestedTier: CreditTier;
  requestedAmount: string;
  requestedDurationDays: number;
  identityAttestations: IdentityAttestation[];
  onchainHistory: OnchainHistory;
  offchainAttestations: OffchainAttestation[];
  loanPurpose: LoanPurpose;
  privacyStatement: string;
  submittedAt: string;
}

export interface IdentityAttestation {
  type: string;
  provider: string;
  attestationHash: string;
  confidence: IdentityConfidence;
}

export interface OnchainHistory {
  walletAgeDays: number;
  priorLoanRepayments: number;
  defaults: number;
  liquidations: number;
  suspiciousPatterns: string[];
}

export interface OffchainAttestation {
  type: string;
  issuerHash: string;
  documentHash: string;
  summary: string;
}

export interface LoanPurpose {
  category: string;
  summary: string;
  requestedAmount: string;
  requestedDurationDays: number;
}

export interface Loan {
  id: string;
  borrowerId: string;
  poolId: string;
  principal: string;
  collateral: string;
  collateralRatio: number;
  durationDays: number;
  status: LoanStatus;
  createdAt: string;
  dueAt: string;
}

export interface Repayment {
  id: string;
  loanId: string;
  amount: string;
  paidAt: string;
  txHash: string;
  status: "CONFIRMED" | "PARTIAL" | "LATE" | "DISPUTED";
}

export interface DefaultReview {
  id: string;
  loanId: string;
  missedDueDate: string;
  amountDue: string;
  amountPaid: string;
  borrowerExplanation: string;
  supportingEvidenceHashes: string[];
  requestedOutcome: string;
  outcome?: DefaultReviewOutcome;
  reasoning?: string;
  createdAt: string;
}

export interface CreditAppeal {
  id: string;
  reviewId: string;
  appealReason: string;
  missingContext: string;
  counterEvidenceSummary: string;
  requestedOutcome: string;
  additionalEvidenceHashes: string[];
  outcome?: AppealOutcome;
  reasoning?: string;
  status: "SUBMITTED" | "REVIEWED";
  createdAt: string;
}

export interface ProtocolStats {
  totalReviews: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalLoans: number;
  totalRepaid: number;
  totalDefaults: number;
  totalAppeals: number;
  appealReversals: number;
  avgCollateralRatio: number;
  avgConfidence: number;
  totalBorrowers: number;
  totalPools: number;
}
