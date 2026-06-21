"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { getClientReady } from "@/lib/genlayer/client";
import { getContractAddress } from "@/lib/genlayer/contract";
import { waitForTx } from "@/lib/genlayer/txWaiter";
import { Scale, Plus, X, Loader2 } from "lucide-react";
import type { CreditAppeal } from "@/lib/genlayer/types";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const APPEAL_OUTCOME_COLOR: Record<string, string> = {
  UPHELD: "grey", TIER_UPGRADED: "green", TIER_DOWNGRADED: "red",
  COLLATERAL_RATIO_REDUCED: "green", COLLATERAL_RATIO_INCREASED: "red",
  REVIEW_AGAIN_WITH_MORE_EVIDENCE: "amber", ESCALATED_TO_HUMAN: "grey",
};

function AppealsContent() {
  const params = useSearchParams();
  const prefilledReviewId = params.get("reviewId") ?? "";
  const { appeals, reviews, addAppeal, updateAppeal } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(!!prefilledReviewId);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    reviewId: prefilledReviewId,
    appealReason: "",
    missingContext: "",
    counterEvidenceSummary: "",
    requestedOutcome: "COLLATERAL_RATIO_REDUCED",
  });

  const approvedReviews = reviews.filter((r) => r.status === "REVIEWED");

  async function handleSubmit() {
    if (!address || !form.reviewId || !form.appealReason) return;
    setSubmitting(true);
    setError(null);
    setTxStatus("Waiting for wallet signature…");
    try {
      const appealId = `appeal_${Date.now()}`;
      const appealPacket = JSON.stringify({
        appealReason: form.appealReason,
        missingContext: form.missingContext,
        counterEvidenceSummary: form.counterEvidenceSummary,
        requestedOutcome: form.requestedOutcome,
      });

      const client = await getClientReady();
      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "submit_credit_appeal",
        args: [appealId, form.reviewId, appealPacket],
        account: address,
      });

      setTxStatus("Submitted — waiting for GenLayer consensus…");
      await waitForTx(txHash as `0x${string}`);

      const appeal: CreditAppeal = {
        id: appealId,
        reviewId: form.reviewId,
        appealReason: form.appealReason,
        missingContext: form.missingContext,
        counterEvidenceSummary: form.counterEvidenceSummary,
        requestedOutcome: form.requestedOutcome,
        additionalEvidenceHashes: [],
        status: "SUBMITTED",
        createdAt: new Date().toISOString(),
      };
      addAppeal(appeal);
      setShowForm(false);
      setTxStatus(null);
      setForm({ reviewId: "", appealReason: "", missingContext: "", counterEvidenceSummary: "", requestedOutcome: "COLLATERAL_RATIO_REDUCED" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(a: CreditAppeal) {
    if (!address) return;
    setReviewing(a.id);
    setError(null);
    try {
      const client = await getClientReady();
      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "review_credit_appeal",
        args: [a.id],
        account: address,
      });

      await waitForTx(txHash as `0x${string}`);

      const result = await (client as any).readContract({
        address: getContractAddress(),
        functionName: "get_credit_appeal",
        args: [a.id],
      });

      const data = JSON.parse(typeof result === "string" ? result : JSON.stringify(result));
      if (data.outcome) {
        updateAppeal(a.id, { outcome: data.outcome, reasoning: data.reasoning, status: "REVIEWED" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-ink">{appeals.length} appeals filed</p>
        <Button onClick={() => { setShowForm(true); setError(null); }} size="sm"><Plus size={13} /> File Appeal</Button>
      </div>

      {error && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}

      <AnimatePresence>
        {showForm && (
          <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-[15px]">File Credit Appeal</h3>
              <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Credit Review</label>
                <select value={form.reviewId} onChange={(e) => setForm((f) => ({ ...f, reviewId: e.target.value }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                  <option value="">Select review…</option>
                  {approvedReviews.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.verdict?.decision}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Requested Outcome</label>
                <select value={form.requestedOutcome} onChange={(e) => setForm((f) => ({ ...f, requestedOutcome: e.target.value }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                  {["COLLATERAL_RATIO_REDUCED","TIER_UPGRADED","REVIEW_AGAIN_WITH_MORE_EVIDENCE","UPHELD"].map((o) => (
                    <option key={o}>{o.replace(/_/g," ")}</option>
                  ))}
                </select>
              </div>
            </div>
            {[
              { key: "appealReason", label: "Appeal Reason", placeholder: "Why are you appealing this credit decision?" },
              { key: "missingContext", label: "Missing Context", placeholder: "What context was not available during the original review?" },
              { key: "counterEvidenceSummary", label: "Counter-Evidence Summary", placeholder: "Describe any new evidence supporting your appeal…" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">{label}</label>
                <textarea value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  rows={2} placeholder={placeholder}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
              </div>
            ))}
            <div className="p-3 bg-[rgba(17,17,17,0.03)] border border-[rgba(17,17,17,0.08)] text-[11px] text-muted-ink">
              Human review required for suspected fraud or identity theft.
            </div>
            {txStatus && <p className="text-[12px] text-[#2457FF] font-financial">{txStatus}</p>}
            {error && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}
            <Button onClick={handleSubmit} disabled={submitting || !form.reviewId || !form.appealReason} size="sm">
              {submitting ? txStatus ?? "Processing…" : "Submit Appeal"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {appeals.length === 0 && !showForm && (
          <div className="panel p-8 text-center">
            <Scale size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
            <p className="text-[13px] text-muted-ink">No appeals filed yet.</p>
          </div>
        )}
        {appeals.map((a) => {
          const isReviewing = reviewing === a.id;
          return (
            <div key={a.id} className="panel p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Scale size={15} className="text-[#2457FF]" />
                  <div>
                    <p className="font-heading font-bold text-[14px] text-ink">Appeal re: {a.reviewId}</p>
                    <p className="text-[11px] font-financial text-muted-ink">{a.id} · {format(new Date(a.createdAt), "dd MMM yyyy")}</p>
                  </div>
                </div>
                {a.outcome ? (
                  <Badge variant={APPEAL_OUTCOME_COLOR[a.outcome] as any}>{a.outcome.replace(/_/g," ")}</Badge>
                ) : <Badge variant="amber">PENDING</Badge>}
              </div>
              <div className="space-y-2 mb-3">
                <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Appeal Reason</p><p className="text-[13px] text-ink">{a.appealReason}</p></div>
                {a.missingContext && <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Missing Context</p><p className="text-[12px] text-muted-ink">{a.missingContext}</p></div>}
                {a.counterEvidenceSummary && <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Counter Evidence</p><p className="text-[12px] text-muted-ink">{a.counterEvidenceSummary}</p></div>}
              </div>
              {a.outcome && a.reasoning ? (
                <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)]">
                  <p className="text-[9px] font-financial uppercase tracking-widest text-[#2457FF] mb-1">GenLayer Appeal Verdict</p>
                  <p className="text-[12px] text-ink">{a.reasoning}</p>
                </div>
              ) : !a.outcome && (
                <Button size="sm" variant="secondary" disabled={isReviewing || !address} onClick={() => handleReview(a)}>
                  {isReviewing ? <><Loader2 size={12} className="animate-spin" /> Reviewing…</> : "Trigger GenLayer Appeal Review"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AppealsPage() {
  return (
    <AppShell title="Appeals">
      <Suspense fallback={<div className="p-6 text-muted-ink">Loading…</div>}>
        <AppealsContent />
      </Suspense>
    </AppShell>
  );
}
