export type PoolStatus = "ACTIVE" | "PAUSED" | "CLOSED";

export type LoanStatus =
  | "APPROVED_NOT_DRAWN"
  | "ACTIVE"
  | "PARTIALLY_REPAID"
  | "REPAID"
  | "OVERDUE"
  | "DEFAULT_REVIEW"
  | "DEFAULT_CONFIRMED"
  | "DISPUTED"
  | "CLOSED";

export type ReviewStatus =
  | "PENDING"
  | "EVALUATING"
  | "APPROVED"
  | "APPROVED_LIMITED"
  | "REJECTED"
  | "MORE_EVIDENCE_REQUIRED"
  | "ESCALATED";

export type ReviewVerdict = "APPROVE" | "APPROVE_LIMITED" | "REQUEST_MORE_EVIDENCE" | "REJECT" | "ESCALATE";
export type DefaultVerdict = "DEFAULT_CONFIRMED" | "DEFAULT_DISPUTED" | "DEFAULT_CURED" | "ESCALATE";
export type AppealVerdict = "APPEAL_UPHELD" | "APPEAL_REJECTED" | "REQUEST_MORE_EVIDENCE" | "ESCALATE";

export interface LenderPool {
  pool_id: string;
  lender_address: string;
  pool_name: string;
  description: string;
  policy_id: string;
  pool_native_balance: number;        // wei
  available_native_liquidity: number; // wei
  total_drawn_native: number;         // wei
  total_repaid_native: number;        // wei
  active_loan_count: number;
  status: PoolStatus;
  created_at: string;
  updated_at: string;
}

export interface RiskPolicy {
  policy_id: string;
  pool_id: string;
  lender_address: string;
  policy_name: string;
  min_trust_score: number;
  max_risk_band: string;
  max_loan_native: number; // wei
  max_duration_days: number;
  required_evidence: string[];
  allowed_borrower_types: string[];
  default_tolerance: string;
  appeal_allowed: boolean;
  policy_notes: string;
  created_at: string;
}

export interface BorrowerProfile {
  borrower_id: string;
  borrower_address: string;
  borrower_name: string;
  borrower_type: string;
  purpose_summary: string;
  wallet_history_summary: string;
  repayment_history_summary: string;
  income_or_revenue_summary: string;
  dao_or_work_history: string;
  guarantor_note: string;
  evidence_urls: string[];
  repayment_count: number;
  default_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreditReview {
  review_id: string;
  borrower_id: string;
  pool_id: string;
  policy_id: string;
  requested_amount_native: number; // wei
  packet: Record<string, unknown>;
  status: ReviewStatus;
  verdict: ReviewVerdict | null;
  risk_band: string | null;
  trust_score: number | null;
  approved_amount_native: number; // wei
  requires_more_evidence: boolean;
  red_flags_summary: string;
  missing_evidence_summary: string;
  consensus_memo: string;
  created_at: string;
  evaluated_at: string | null;
}

export interface Loan {
  loan_id: string;
  review_id: string;
  borrower_id: string;
  pool_id: string;
  lender_address: string;
  borrower_address: string;
  principal_native: number;    // wei
  repay_due_native: number;    // wei
  drawn_amount_native: number; // wei
  repaid_amount_native: number;    // wei
  outstanding_amount_native: number; // wei
  due_timestamp: number;
  status: LoanStatus;
  created_at: string;
  drawn_at: string | null;
  repaid_at: string | null;
}

export interface DefaultReview {
  default_review_id: string;
  loan_id: string;
  opened_by: string;
  reason: string;
  borrower_response: string;
  evidence_urls: string[];
  verdict: DefaultVerdict | null;
  memo: string;
  status: string;
  created_at: string;
  evaluated_at: string | null;
}

export interface Appeal {
  appeal_id: string;
  target_type: "review" | "default";
  target_id: string;
  borrower_id: string;
  submitted_by: string;
  new_evidence_summary: string;
  new_evidence_urls: string[];
  old_verdict: string;
  new_verdict: AppealVerdict | null;
  memo: string;
  status: string;
  created_at: string;
  evaluated_at: string | null;
}
