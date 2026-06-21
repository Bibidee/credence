"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import CreditDecisionStamp from "@/components/credit/CreditDecisionStamp";
import CreditTierBadge from "@/components/credit/CreditTierBadge";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { buildReputationPacket } from "@/lib/credence/reputationPacketBuilder";
import { getClientReady } from "@/lib/genlayer/client";
import { getContractAddress } from "@/lib/genlayer/contract";
import { waitForTx } from "@/lib/genlayer/txWaiter";
import { normalizeCreditVerdict } from "@/lib/genlayer/normalizeCreditVerdict";
import { FileSearch, Plus, X, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CreditReview, CreditTier } from "@/lib/genlayer/types";
import { motion, AnimatePresence } from "framer-motion";

const TIERS: CreditTier[] = ["TIER_1_TRIAL","TIER_2_LIMITED","TIER_3_TRUSTED","TIER_4_HIGH_TRUST"];

export default function CreditReviewsPage() {
  const { reviews, pools, borrowers, addReview, updateReview } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    poolId: "",
    requestedTier: "TIER_2_LIMITED" as CreditTier,
    requestedAmount: "500",
    requestedDurationDays: 30,
    walletAgeDays: 180,
    priorRepayments: 0,
    loanPurpose: "WORKING_CAPITAL",
    loanPurposeSummary: "",
    incomeSummary: "",
  });

  const borrower = borrowers.find((b) => b.wallet.toLowerCase() === address?.toLowerCase());

  async function handleSubmit() {
    if (!address || !form.poolId || !borrower) return;
    setSubmitting(true);
    setError(null);
    setTxStatus("Building reputation packet…");
    try {
      const reviewId = `review_${Date.now()}`;
      const { packetHash, evidenceHash, packet } = await buildReputationPacket({
        reviewId,
        borrowerId: borrower.id,
        poolId: form.poolId,
        walletAddress: address,
        requestedTier: form.requestedTier,
        requestedAmount: `${form.requestedAmount} USDC`,
        requestedDurationDays: form.requestedDurationDays,
        identityAttestations: [],
        onchainHistory: {
          walletAgeDays: form.walletAgeDays,
          priorLoanRepayments: form.priorRepayments,
          defaults: 0,
          liquidations: 0,
          suspiciousPatterns: [],
        },
        offchainAttestations: form.incomeSummary ? [{
          type: "INCOME_SUMMARY",
          issuerHash: "issuer_hash_self",
          documentHash: `hash_income_${Date.now()}`,
          summary: form.incomeSummary,
        }] : [],
        loanPurpose: {
          category: form.loanPurpose,
          summary: form.loanPurposeSummary || `${form.loanPurpose} loan request`,
          requestedAmount: `${form.requestedAmount} USDC`,
          requestedDurationDays: form.requestedDurationDays,
        },
      });

      const client = await getClientReady();
      setTxStatus("Waiting for wallet signature…");

      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "submit_reputation_packet",
        args: [reviewId, borrower.id, form.poolId, JSON.stringify({ ...packet, packetHash }), evidenceHash],
        account: address,
      });

      setTxStatus("Submitted — waiting for GenLayer consensus…");
      await waitForTx(txHash as `0x${string}`);

      const review: CreditReview = {
        id: reviewId,
        borrowerId: borrower.id,
        poolId: form.poolId,
        reputationPacketHash: packetHash,
        evidenceHash,
        status: "SUBMITTED",
        createdAt: new Date().toISOString(),
      };
      addReview(review);
      setShowForm(false);
      setTxStatus(null);
      setForm({ poolId: "", requestedTier: "TIER_2_LIMITED", requestedAmount: "500", requestedDurationDays: 30, walletAgeDays: 180, priorRepayments: 0, loanPurpose: "WORKING_CAPITAL", loanPurposeSummary: "", incomeSummary: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTriggerReview(reviewId: string) {
    if (!address) return;
    setTriggering(reviewId);
    setError(null);
    try {
      updateReview(reviewId, { status: "UNDER_REVIEW" });
      const client = await getClientReady();

      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "review_borrower_credit",
        args: [reviewId],
        account: address,
      });

      await waitForTx(txHash as `0x${string}`);

      const result = await (client as any).readContract({
        address: getContractAddress(),
        functionName: "get_credit_review",
        args: [reviewId],
      });

      const data = JSON.parse(typeof result === "string" ? result : JSON.stringify(result));
      if (data.verdict) {
        updateReview(reviewId, { status: "REVIEWED", verdict: normalizeCreditVerdict(data.verdict) });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
      updateReview(reviewId, { status: "SUBMITTED" });
    } finally {
      setTriggering(null);
    }
  }

  return (
    <AppShell title="Credit Reviews">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{reviews.length} reviews total</p>
          <Button onClick={() => { setShowForm(true); setError(null); }} size="sm" disabled={!borrower}>
            <Plus size={13} /> Submit Review
          </Button>
        </div>

        {!borrower && address && (
          <div className="panel p-4 text-[13px] text-muted-ink">
            Register your <Link href="/borrower-passport" className="text-[#2457FF] underline">Borrower Passport</Link> first before submitting a credit review.
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[15px]">Submit Reputation Packet</h3>
                <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Lender Pool</label>
                  <select value={form.poolId} onChange={(e) => setForm((f) => ({ ...f, poolId: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                    <option value="">Select pool…</option>
                    {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Requested Credit Tier</label>
                  <select value={form.requestedTier} onChange={(e) => setForm((f) => ({ ...f, requestedTier: e.target.value as CreditTier }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                    {TIERS.map((t) => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Requested Amount (USDC)</label>
                  <input type="number" value={form.requestedAmount} onChange={(e) => setForm((f) => ({ ...f, requestedAmount: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Duration (days)</label>
                  <input type="number" value={form.requestedDurationDays} onChange={(e) => setForm((f) => ({ ...f, requestedDurationDays: Number(e.target.value) }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Wallet Age (days)</label>
                  <input type="number" value={form.walletAgeDays} onChange={(e) => setForm((f) => ({ ...f, walletAgeDays: Number(e.target.value) }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Prior Repayments</label>
                  <input type="number" value={form.priorRepayments} onChange={(e) => setForm((f) => ({ ...f, priorRepayments: Number(e.target.value) }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Loan Purpose</label>
                  <select value={form.loanPurpose} onChange={(e) => setForm((f) => ({ ...f, loanPurpose: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                    {["WORKING_CAPITAL","INVENTORY","EDUCATION","FREELANCE_BRIDGE","DAO_PROJECT","BUSINESS_EXPANSION"].map((lp) => (
                      <option key={lp}>{lp}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Loan Purpose Summary</label>
                <textarea value={form.loanPurposeSummary} onChange={(e) => setForm((f) => ({ ...f, loanPurposeSummary: e.target.value }))}
                  rows={2} placeholder="Brief description of loan purpose…"
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Income Attestation Summary (optional)</label>
                <input value={form.incomeSummary} onChange={(e) => setForm((f) => ({ ...f, incomeSummary: e.target.value }))}
                  placeholder="e.g. Consistent monthly inflow for 6 months"
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
              </div>
              <div className="p-3 bg-[rgba(17,17,17,0.03)] text-[11px] text-muted-ink border border-[rgba(17,17,17,0.08)]">
                Raw private documents are not submitted. Only hashes, summaries, and attestation references are stored on GenLayer.
              </div>
              {txStatus && <p className="text-[12px] text-[#2457FF] font-financial">{txStatus}</p>}
              {error && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}
              <Button onClick={handleSubmit} disabled={submitting || !form.poolId} size="sm">
                {submitting ? txStatus ?? "Processing…" : "Submit Reputation Packet"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && !showForm && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}

        <div className="panel">
          {reviews.length === 0 ? (
            <div className="p-10 text-center">
              <FileSearch size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
              <p className="text-[13px] text-muted-ink">No credit reviews yet.</p>
            </div>
          ) : (
            <table className="w-full ledger-table">
              <thead>
                <tr><th>Review ID</th><th>Borrower</th><th>Pool</th><th>Status</th><th>Decision</th><th>Tier</th><th></th></tr>
              </thead>
              <tbody>
                {reviews.map((r) => {
                  const b = borrowers.find((bw) => bw.id === r.borrowerId);
                  const pool = pools.find((p) => p.id === r.poolId);
                  const isTriggering = triggering === r.id;
                  return (
                    <tr key={r.id}>
                      <td className="font-financial text-[11px]">{r.id}</td>
                      <td className="text-[12px]">{b?.alias ?? r.borrowerId}</td>
                      <td className="text-[12px] text-muted-ink">{pool?.name ?? r.poolId}</td>
                      <td>
                        <Badge variant={r.status === "REVIEWED" ? "green" : r.status === "UNDER_REVIEW" ? "amber" : "grey"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td>{r.verdict ? <CreditDecisionStamp decision={r.verdict.decision} /> : <span className="text-muted-ink text-[11px]">—</span>}</td>
                      <td>{r.verdict ? <CreditTierBadge tier={r.verdict.creditTier} /> : <span className="text-muted-ink text-[11px]">—</span>}</td>
                      <td className="space-x-2">
                        {r.status === "SUBMITTED" && (
                          <button
                            disabled={isTriggering}
                            onClick={() => handleTriggerReview(r.id)}
                            className="text-[11px] text-[#2457FF] hover:underline disabled:opacity-50 flex items-center gap-1"
                          >
                            {isTriggering ? <><Loader2 size={10} className="animate-spin" /> Reviewing…</> : "Trigger AI Review →"}
                          </button>
                        )}
                        {r.status !== "SUBMITTED" && (
                          <Link href={`/credit-reviews/${r.id}`} className="text-[11px] text-[#2457FF] hover:underline">View →</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
