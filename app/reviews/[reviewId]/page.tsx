"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiEvaluateReview, apiCreateLoan } from "@/lib/genlayer/contractApi";
import { formatGEN, formatTimestamp, explorerAddress } from "@/lib/utils/format";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const router = useRouter();
  const { reviews, pools, borrowers, registerReviewId, registerLoanId, refreshReview, refreshLoan, refreshPool } = useCredence();
  const { address } = useWallet();
  const review = reviews.find(r => r.review_id === reviewId);
  const pool = pools.find(p => p.pool_id === review?.pool_id);
  const borrower = borrowers.find(b => b.borrower_id === review?.borrower_id);
  const [txState, setTxState] = useState<{ status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string; msg?: string }>({ status: "idle" });

  useEffect(() => {
    if (!review) { registerReviewId(reviewId); refreshReview(reviewId); }
  }, [reviewId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEvaluate() {
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiEvaluateReview(reviewId);
      await refreshReview(reviewId);
      setTxState({ status: "success", hash, msg: "GenLayer consensus evaluation complete." });
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Evaluation failed" });
    }
  }

  async function handleCreateLoan() {
    if (!review) return;
    const loanId = `loan_${Date.now()}`;
    setTxState({ status: "pending", msg: "Creating loan on GenLayer…" });
    try {
      const hash = await apiCreateLoan(loanId, reviewId);
      registerLoanId(loanId);
      await Promise.all([refreshLoan(loanId), refreshPool(review.pool_id)]);
      setTxState({ status: "success", hash, msg: "Loan created. Pool liquidity reserved." });
      setTimeout(() => router.push(`/loans/${loanId}`), 1200);
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Loan creation failed" });
    }
  }

  async function handleAppeal() {
    if (!review) return;
    router.push(`/appeals?targetType=review&targetId=${reviewId}&oldVerdict=${review.verdict ?? "REJECT"}&borrowerId=${review.borrower_id}`);
  }

  if (!review) return (
    <AppShell title="Review">
      <div className="p-6 flex items-center gap-2 text-muted-ink text-[13px]">
        <Loader2 size={14} className="animate-spin" /> Loading review…
      </div>
    </AppShell>
  );

  const isApproved = review.verdict === "APPROVE" || review.verdict === "APPROVE_LIMITED";
  const isLenderOwner = address?.toLowerCase() === pool?.lender_address?.toLowerCase();
  const isBorrower = address?.toLowerCase() === (borrower?.borrower_address?.toLowerCase() ?? "");
  const canEvaluate = review.status === "PENDING" || review.status === "EVALUATING";
  const canCreateLoan = isApproved && isBorrower;
  const canAppeal = review.status === "REJECTED" && isBorrower;

  const verdictColor = review.verdict === "APPROVE" ? "green" : review.verdict === "APPROVE_LIMITED" ? "blue" : review.verdict === "REJECT" ? "red" : "amber";

  return (
    <AppShell title="Credit Review">
      <div className="p-6 space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading font-bold text-[18px] text-ink">Credit Review</h2>
            <p className="text-[11px] font-financial text-muted-ink">{review.review_id}</p>
          </div>
          <Badge variant={
            review.status === "APPROVED" ? "green" : review.status === "APPROVED_LIMITED" ? "blue" :
            review.status === "REJECTED" ? "red" : review.status === "PENDING" ? "grey" : "amber"
          }>{review.status.replace(/_/g," ")}</Badge>
        </div>

        {/* Context */}
        <div className="grid grid-cols-3 gap-4">
          <div className="panel p-4">
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Borrower</p>
            <p className="font-medium text-[13px] mt-1">{borrower?.borrower_name ?? review.borrower_id.slice(-10)}</p>
            <p className="text-[11px] text-muted-ink">{borrower?.borrower_type}</p>
          </div>
          <div className="panel p-4">
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Pool</p>
            <p className="font-medium text-[13px] mt-1">{pool?.pool_name ?? review.pool_id.slice(-10)}</p>
            <p className="text-[11px] text-muted-ink">{pool ? formatGEN(pool.available_native_liquidity) + " available" : ""}</p>
          </div>
          <div className="panel p-4">
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Requested</p>
            <p className="font-bold text-[16px] mt-1">{formatGEN(review.requested_amount_native)}</p>
            <p className="text-[11px] text-muted-ink">Submitted {formatTimestamp(review.created_at)}</p>
          </div>
        </div>

        <TxBanner status={txState.status} message={txState.msg} txHash={txState.hash} error={txState.error} />

        {/* Evaluate button */}
        {canEvaluate && (
          <div className="panel p-5">
            <h3 className="font-heading font-bold text-[14px] mb-2">GenLayer Credit Evaluation</h3>
            <p className="text-[13px] text-muted-ink mb-3">
              Trigger GenLayer consensus to evaluate this borrower's reputation packet against the lender's risk policy.
              Validators will assess credibility, repayment capacity, and risk band.
            </p>
            <Button onClick={handleEvaluate} disabled={txState.status === "pending"}>
              {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin mr-1" /> Evaluating…</> : "Trigger GenLayer Evaluation"}
            </Button>
          </div>
        )}

        {/* Verdict */}
        {review.verdict && (
          <div className={`panel p-5 border-l-4 ${isApproved ? "border-[#2E9D68]" : "border-[#C8342D]"}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-[15px]">GenLayer Consensus Verdict</h3>
              <Badge variant={verdictColor as any}>{review.verdict}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Trust Score</p>
                <p className="font-bold text-[22px]">{review.trust_score ?? "—"}<span className="text-[14px] text-muted-ink">/100</span></p>
              </div>
              <div>
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Risk Band</p>
                <p className="font-bold text-[16px]">{review.risk_band ?? "—"}</p>
              </div>
              <div>
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Approved Amount</p>
                <p className={`font-bold text-[16px] ${isApproved ? "text-[#2E9D68]" : "text-muted-ink"}`}>
                  {isApproved ? formatGEN(review.approved_amount_native) : "—"}
                </p>
              </div>
            </div>
            {review.consensus_memo && (
              <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)] mb-3">
                <p className="text-[9px] font-financial uppercase tracking-widest text-[#2457FF] mb-1">Consensus Memo</p>
                <p className="text-[13px] text-ink">{review.consensus_memo}</p>
              </div>
            )}
            {review.red_flags_summary && (
              <div className="mb-2">
                <p className="text-[10px] font-financial uppercase tracking-widest text-[#C8342D] mb-0.5">Red Flags</p>
                <p className="text-[12px] text-ink">{review.red_flags_summary}</p>
              </div>
            )}
            {review.missing_evidence_summary && (
              <div>
                <p className="text-[10px] font-financial uppercase tracking-widest text-[#F2A93B] mb-0.5">Missing Evidence</p>
                <p className="text-[12px] text-ink">{review.missing_evidence_summary}</p>
              </div>
            )}
            {review.evaluated_at && (
              <p className="text-[11px] text-muted-ink mt-2 font-financial">Evaluated {formatTimestamp(review.evaluated_at)}</p>
            )}
          </div>
        )}

        {/* Actions */}
        {(canCreateLoan || canAppeal) && (
          <div className="flex gap-3">
            {canCreateLoan && (
              <Button onClick={handleCreateLoan} disabled={txState.status === "pending"}>
                {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin mr-1" /> Creating Loan…</> : `Create Loan — ${formatGEN(review.approved_amount_native)}`}
              </Button>
            )}
            {canAppeal && (
              <Button variant="secondary" onClick={handleAppeal}>Appeal This Decision</Button>
            )}
          </div>
        )}

        {/* Borrower Packet */}
        {review.packet && Object.keys(review.packet).length > 0 && (
          <div className="panel p-5">
            <h3 className="font-heading font-bold text-[14px] mb-3">Reputation Packet Submitted</h3>
            <div className="space-y-2">
              {Object.entries(review.packet).filter(([k]) => !["walletAddress","submittedAt"].includes(k)).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink">{k.replace(/([A-Z])/g, " $1")}</p>
                  <p className="text-[12px] text-ink">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {pool && <Link href={`/pools/${pool.pool_id}`} className="text-[12px] text-[#2457FF] hover:underline">View Pool →</Link>}
          {borrower && <Link href={`/borrowers/${borrower.borrower_id}`} className="text-[12px] text-[#2457FF] hover:underline">View Borrower →</Link>}
        </div>
      </div>
    </AppShell>
  );
}
