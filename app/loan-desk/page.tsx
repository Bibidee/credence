"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import CreditTermSheet from "@/components/credit/CreditTermSheet";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { getClientReady } from "@/lib/genlayer/client";
import { getContractAddress } from "@/lib/genlayer/contract";
import { waitForTx } from "@/lib/genlayer/txWaiter";
import { Landmark, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Loan } from "@/lib/genlayer/types";
import { format, addDays } from "date-fns";

const LOAN_PURPOSES = ["WORKING_CAPITAL","INVENTORY","EDUCATION","FREELANCE_BRIDGE","DAO_PROJECT","BUSINESS_EXPANSION"];

export default function LoanDeskPage() {
  const { reviews, pools, borrowers, loans, addLoan } = useCredence();
  const { address } = useWallet();
  const [form, setForm] = useState({
    poolId: "", reviewId: "", amount: "500", durationDays: 30,
    loanPurpose: "WORKING_CAPITAL", repaymentPlan: "Single repayment at maturity",
  });
  const [submitting, setSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const approvedReviews = reviews.filter((r) => r.verdict && ["APPROVED_FULL_TERMS","APPROVED_LIMITED_CREDIT","APPROVED_WITH_HIGHER_COLLATERAL"].includes(r.verdict.decision));
  const selectedReview = reviews.find((r) => r.id === form.reviewId);
  const verdict = selectedReview?.verdict;
  const borrower = borrowers.find((b) => b.wallet.toLowerCase() === address?.toLowerCase());

  async function handleSubmit() {
    if (!address || !form.poolId || !form.reviewId || !verdict || !borrower) return;
    setSubmitting(true);
    setError(null);
    setTxStatus("Preparing transaction…");
    try {
      const loanId = `loan_${Date.now()}`;
      const loanRequestId = `loanreq_${Date.now()}`;
      const ratio = verdict.recommendedCollateralRatio;
      const collateral = Math.ceil(Number(form.amount) * ratio / 100);
      const dueAt = addDays(new Date(), form.durationDays).toISOString();

      const requestPacket = JSON.stringify({
        requestedAmount: `${form.amount} USDC`,
        collateralOffered: `${collateral} USDC`,
        collateralRatio: ratio,
        durationDays: form.durationDays,
        purpose: form.loanPurpose,
        repaymentPlan: form.repaymentPlan,
        reviewId: form.reviewId,
      });

      const client = await getClientReady();
      setTxStatus("Waiting for wallet signature (loan request)…");

      const reqTxHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "submit_loan_request",
        args: [loanRequestId, borrower.id, form.poolId, requestPacket],
        account: address,
      });

      setTxStatus("Submitting loan request to GenLayer…");
      await waitForTx(reqTxHash as `0x${string}`);

      setTxStatus("Waiting for wallet signature (accept terms)…");

      const termsJson = JSON.stringify({
        borrowerId: borrower.id,
        poolId: form.poolId,
        principal: `${form.amount} USDC`,
        collateral: `${collateral} USDC`,
        collateralRatio: ratio,
        durationDays: form.durationDays,
        dueAt,
      });

      const acceptTxHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "accept_loan_terms",
        args: [loanId, loanRequestId, termsJson],
        account: address,
      });

      setTxStatus("Accepting terms on GenLayer…");
      await waitForTx(acceptTxHash as `0x${string}`);

      const loan: Loan = {
        id: loanId,
        borrowerId: borrower.id,
        poolId: form.poolId,
        principal: `${form.amount} USDC`,
        collateral: `${collateral} USDC`,
        collateralRatio: ratio,
        durationDays: form.durationDays,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        dueAt,
      };
      addLoan(loan);
      setSubmitted(true);
      setTxStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Loan Desk">
      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Landmark size={16} className="text-[#D6A84F]" />
          <h2 className="font-heading font-bold text-[18px]">Submit Loan Request</h2>
        </div>

        <div className="panel p-3 border-[rgba(242,169,59,0.3)] bg-[rgba(242,169,59,0.04)] text-[12px] text-ink flex items-start gap-2">
          <AlertTriangle size={13} className="text-[#F2A93B] mt-0.5 shrink-0" />
          Your collateral ratio is set by the GenLayer credit review. Submitting accepts these terms on-chain — two wallet signatures required.
        </div>

        {!submitted ? (
          <div className="panel p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Target Pool</label>
                <select value={form.poolId} onChange={(e) => setForm((f) => ({ ...f, poolId: e.target.value }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                  <option value="">Select pool…</option>
                  {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Approved Credit Review</label>
                <select value={form.reviewId} onChange={(e) => setForm((f) => ({ ...f, reviewId: e.target.value }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                  <option value="">Select review…</option>
                  {approvedReviews.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.verdict?.decision}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Amount (USDC)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Duration (days)</label>
                <input type="number" value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Loan Purpose</label>
                <select value={form.loanPurpose} onChange={(e) => setForm((f) => ({ ...f, loanPurpose: e.target.value }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                  {LOAN_PURPOSES.map((lp) => <option key={lp}>{lp}</option>)}
                </select>
              </div>
            </div>

            <AnimatePresence>
              {verdict && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink mb-2">Term Sheet from Credit Review</p>
                  <CreditTermSheet termSheet={verdict.termSheet} />
                </motion.div>
              )}
            </AnimatePresence>

            {txStatus && <p className="text-[12px] text-[#2457FF] font-financial">{txStatus}</p>}
            {error && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}

            <Button onClick={handleSubmit} disabled={submitting || !form.poolId || !form.reviewId || !verdict || !borrower}>
              {submitting ? txStatus ?? "Processing…" : "Accept Terms & Submit Loan Request"}
            </Button>
            {!borrower && <p className="text-[11px] text-muted-ink">Register your Borrower Passport first.</p>}
            {approvedReviews.length === 0 && <p className="text-[11px] text-muted-ink">No approved credit reviews yet. Complete a credit review first.</p>}
          </div>
        ) : (
          <motion.div className="panel p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-10 h-10 bg-[#2E9D68] flex items-center justify-center mx-auto mb-4">
              <Landmark size={20} className="text-white" />
            </div>
            <h3 className="font-heading font-bold text-[18px] text-ink mb-2">Loan Accepted on GenLayer</h3>
            <p className="text-[13px] text-muted-ink">Your loan terms are recorded on-chain. Track repayment in the Repayments page.</p>
            <Button variant="secondary" size="sm" className="mt-5" onClick={() => { setSubmitted(false); setError(null); }}>
              Submit Another
            </Button>
          </motion.div>
        )}

        {loans.length > 0 && (
          <div className="panel">
            <div className="px-4 py-3 border-b border-[rgba(17,17,17,0.1)]">
              <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Active & Recent Loans</p>
            </div>
            <table className="w-full ledger-table">
              <thead>
                <tr><th>Loan</th><th>Principal</th><th>Collateral</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id}>
                    <td className="font-financial text-[11px]">{l.id}</td>
                    <td className="font-bold text-[13px]">{l.principal}</td>
                    <td className="text-[12px] text-muted-ink">{l.collateral} ({l.collateralRatio}%)</td>
                    <td className="text-[12px]">{format(new Date(l.dueAt), "dd MMM yyyy")}</td>
                    <td>
                      <Badge variant={l.status === "REPAID" ? "green" : l.status === "ACTIVE" ? "blue" : l.status === "LATE" ? "red" : "amber"}>
                        {l.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
