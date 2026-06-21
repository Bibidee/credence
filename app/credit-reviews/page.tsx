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
import { FileSearch, Plus, X } from "lucide-react";
import Link from "next/link";
import type { CreditReview, CreditTier } from "@/lib/genlayer/types";
import { motion, AnimatePresence } from "framer-motion";

const TIERS: CreditTier[] = ["TIER_1_TRIAL","TIER_2_LIMITED","TIER_3_TRUSTED","TIER_4_HIGH_TRUST"];

export default function CreditReviewsPage() {
  const { reviews, pools, borrowers, addReview } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    privacyStatement: true,
  });

  async function handleSubmit() {
    if (!address || !form.poolId) return;
    setSubmitting(true);
    try {
      const borrower = borrowers.find((b) => b.wallet.toLowerCase() === address.toLowerCase()) ?? borrowers[0];
      const reviewId = `review_${Date.now()}`;
      const { packetHash, evidenceHash } = await buildReputationPacket({
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Credit Reviews">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{reviews.length} reviews total</p>
          <Button onClick={() => setShowForm(true)} size="sm"><Plus size={13} /> Submit Review</Button>
        </div>

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
                  <input type="number" value={form.requestedAmount}
                    onChange={(e) => setForm((f) => ({ ...f, requestedAmount: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Duration (days)</label>
                  <input type="number" value={form.requestedDurationDays}
                    onChange={(e) => setForm((f) => ({ ...f, requestedDurationDays: Number(e.target.value) }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Wallet Age (days)</label>
                  <input type="number" value={form.walletAgeDays}
                    onChange={(e) => setForm((f) => ({ ...f, walletAgeDays: Number(e.target.value) }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Prior Repayments</label>
                  <input type="number" value={form.priorRepayments}
                    onChange={(e) => setForm((f) => ({ ...f, priorRepayments: Number(e.target.value) }))}
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
                Raw private documents are not submitted. Only hashes, summaries, and attestation references will be stored on GenLayer.
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !form.poolId} size="sm">
                {submitting ? "Submitting…" : "Submit Reputation Packet"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="panel">
          <table className="w-full ledger-table">
            <thead>
              <tr>
                <th>Review ID</th>
                <th>Borrower</th>
                <th>Pool</th>
                <th>Status</th>
                <th>Decision</th>
                <th>Tier</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => {
                const borrower = borrowers.find((b) => b.id === r.borrowerId);
                const pool = pools.find((p) => p.id === r.poolId);
                return (
                  <tr key={r.id}>
                    <td className="font-financial text-[11px]">{r.id}</td>
                    <td className="text-[12px]">{borrower?.alias ?? r.borrowerId}</td>
                    <td className="text-[12px] text-muted-ink">{pool?.name ?? r.poolId}</td>
                    <td>
                      <Badge variant={r.status === "REVIEWED" ? "green" : r.status === "UNDER_REVIEW" ? "amber" : "grey"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td>{r.verdict ? <CreditDecisionStamp decision={r.verdict.decision} /> : <span className="text-muted-ink text-[11px]">—</span>}</td>
                    <td>{r.verdict ? <CreditTierBadge tier={r.verdict.creditTier} /> : <span className="text-muted-ink text-[11px]">—</span>}</td>
                    <td>
                      <Link href={`/credit-reviews/${r.id}`} className="text-[11px] text-[#2457FF] hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
