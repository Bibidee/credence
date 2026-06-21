"use client";

import { getClientReady } from "./client";
import { getContractAddress } from "./contract";
import { waitForTx } from "./txWaiter";
import type {
  LenderPool, RiskPolicy, BorrowerProfile, CreditReview, Loan, DefaultReview, Appeal,
} from "./types";

const ADDR = getContractAddress;

async function read<T>(fn: string, args: unknown[]): Promise<T> {
  const client = await getClientReady();
  const raw = await (client as any).readContract({
    address: ADDR(),
    functionName: fn,
    args,
  });
  const str = typeof raw === "string" ? raw : JSON.stringify(raw);
  return JSON.parse(str) as T;
}

async function write(fn: string, args: unknown[], value?: bigint): Promise<string> {
  const client = await getClientReady();
  const params: Record<string, unknown> = {
    address: ADDR(),
    functionName: fn,
    args,
  };
  if (value !== undefined) params.value = value;
  const hash = await (client as any).writeContract(params);
  await waitForTx(hash as `0x${string}`);
  return hash as string;
}

// ── Pool ───────────────────────────────────────────────────────────────────

export async function apiGetPool(poolId: string): Promise<LenderPool | null> {
  const p = await read<LenderPool>("get_pool", [poolId]);
  return p && (p as any).pool_id ? p : null;
}

export async function apiCreatePool(poolId: string, name: string, description: string): Promise<string> {
  return write("create_pool", [poolId, name, description]);
}

export async function apiDepositToPool(poolId: string, amountWei: bigint): Promise<string> {
  return write("deposit_to_pool", [poolId, amountWei.toString()], amountWei);
}

export async function apiCreatePolicy(
  poolId: string, policyId: string, policyObj: Record<string, unknown>
): Promise<string> {
  return write("create_policy", [poolId, policyId, JSON.stringify(policyObj)]);
}

export async function apiGetPolicy(policyId: string): Promise<RiskPolicy | null> {
  const p = await read<RiskPolicy>("get_policy", [policyId]);
  return p && (p as any).policy_id ? p : null;
}

// ── Borrower ───────────────────────────────────────────────────────────────

export async function apiGetBorrower(borrowerId: string): Promise<BorrowerProfile | null> {
  const b = await read<BorrowerProfile>("get_borrower", [borrowerId]);
  return b && (b as any).borrower_id ? b : null;
}

export async function apiGetBorrowerByWallet(wallet: string): Promise<BorrowerProfile | null> {
  const b = await read<BorrowerProfile>("get_borrower_by_wallet", [wallet]);
  return b && (b as any).borrower_id ? b : null;
}

export async function apiRegisterBorrower(
  borrowerId: string, data: Record<string, unknown>
): Promise<string> {
  return write("register_borrower", [borrowerId, JSON.stringify(data)]);
}

// ── Review ─────────────────────────────────────────────────────────────────

export async function apiGetReview(reviewId: string): Promise<CreditReview | null> {
  const r = await read<CreditReview>("get_review", [reviewId]);
  return r && (r as any).review_id ? r : null;
}

export async function apiSubmitReputationPacket(
  reviewId: string,
  borrowerId: string,
  poolId: string,
  requestedAmountWei: bigint,
  packet: Record<string, unknown>
): Promise<string> {
  return write("submit_reputation_packet", [
    reviewId, borrowerId, poolId, requestedAmountWei.toString(), JSON.stringify(packet),
  ]);
}

export async function apiEvaluateReview(reviewId: string): Promise<string> {
  return write("evaluate_credit_review", [reviewId]);
}

// ── Loan ───────────────────────────────────────────────────────────────────

export async function apiGetLoan(loanId: string): Promise<Loan | null> {
  const l = await read<Loan>("get_loan", [loanId]);
  return l && (l as any).loan_id ? l : null;
}

export async function apiCreateLoan(loanId: string, reviewId: string): Promise<string> {
  return write("create_loan", [loanId, reviewId]);
}

export async function apiDrawLoan(loanId: string): Promise<string> {
  return write("draw_loan", [loanId]);
}

export async function apiRepayLoan(loanId: string, amountWei: bigint): Promise<string> {
  return write("repay_loan", [loanId, amountWei.toString()], amountWei);
}

// ── Default ────────────────────────────────────────────────────────────────

export async function apiGetDefault(defaultId: string): Promise<DefaultReview | null> {
  const d = await read<DefaultReview>("get_default_review", [defaultId]);
  return d && (d as any).default_review_id ? d : null;
}

export async function apiOpenDefault(
  defaultId: string, loanId: string, reason: string, response: string
): Promise<string> {
  return write("open_default_review", [defaultId, loanId, reason, response]);
}

export async function apiEvaluateDefault(defaultId: string): Promise<string> {
  return write("evaluate_default", [defaultId]);
}

// ── Appeal ─────────────────────────────────────────────────────────────────

export async function apiGetAppeal(appealId: string): Promise<Appeal | null> {
  const a = await read<Appeal>("get_appeal", [appealId]);
  return a && (a as any).appeal_id ? a : null;
}

export async function apiSubmitAppeal(
  appealId: string,
  targetType: "review" | "default",
  targetId: string,
  borrowerId: string,
  newEvidenceSummary: string,
  oldVerdict: string
): Promise<string> {
  return write("submit_appeal", [appealId, targetType, targetId, borrowerId, newEvidenceSummary, oldVerdict]);
}

export async function apiEvaluateAppeal(appealId: string): Promise<string> {
  return write("evaluate_appeal", [appealId]);
}
