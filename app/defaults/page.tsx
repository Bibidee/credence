"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import type { DefaultReview } from "@/lib/genlayer/types";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const OUTCOME_COLOR: Record<string, string> = {
  DEFAULT_CONFIRMED: "red",
  EXTENSION_RECOMMENDED: "amber",
  PARTIAL_REPAYMENT_PLAN: "amber",
  RESTRUCTURE_RECOMMENDED: "blue",
  BORROWER_EXPLANATION_ACCEPTED: "green",
  FRAUD_REVIEW_REQUIRED: "red",
  LENDER_ERROR: "grey",
  NEEDS_MORE_CONTEXT: "grey",
};

export default function DefaultsPage() {
  const { defaults, loans, addDefault, updateDefault } = useCredence();
  const [showForm, setShowForm] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [form, setForm] = useState({
    loanId: "", missedDueDate: "", amountDue: "", amountPaid: "",
    borrowerExplanation: "", requestedOutcome: "EXTENSION_RECOMMENDED",
  });

  async function handleSubmit() {
    if (!form.loanId) return;
    const d: DefaultReview = {
      id: `default_${Date.now()}`,
      loanId: form.loanId,
      missedDueDate: form.missedDueDate || new Date().toISOString(),
      amountDue: `${form.amountDue} USDC`,
      amountPaid: `${form.amountPaid} USDC`,
      borrowerExplanation: form.borrowerExplanation,
      supportingEvidenceHashes: [],
      requestedOutcome: form.requestedOutcome,
      createdAt: new Date().toISOString(),
    };
    addDefault(d);
    setShowForm(false);
    setForm({ loanId: "", missedDueDate: "", amountDue: "", amountPaid: "", borrowerExplanation: "", requestedOutcome: "EXTENSION_RECOMMENDED" });
  }

  async function handleReview(id: string) {
    setReviewing(id);
    await new Promise((r) => setTimeout(r, 4000));
    updateDefault(id, {
      outcome: "EXTENSION_RECOMMENDED",
      reasoning: "The borrower has provided a credible explanation supported by partial repayment. A 7-day extension is consistent with the pool's grace period policy. No fraud signals detected. The partial payment demonstrates good-faith effort.",
    });
    setReviewing(null);
  }

  return (
    <AppShell title="Defaults">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{defaults.length} default reviews</p>
          <Button onClick={() => setShowForm(true)} size="sm"><Plus size={13} /> Report Default</Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[15px]">Report Default for Review</h3>
                <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Loan ID</label>
                  <select value={form.loanId} onChange={(e) => setForm((f) => ({ ...f, loanId: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                    <option value="">Select loan…</option>
                    {loans.filter((l) => l.status === "ACTIVE" || l.status === "LATE").map((l) => (
                      <option key={l.id} value={l.id}>{l.id} — {l.principal}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Requested Outcome</label>
                  <select value={form.requestedOutcome} onChange={(e) => setForm((f) => ({ ...f, requestedOutcome: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                    {["EXTENSION_RECOMMENDED","PARTIAL_REPAYMENT_PLAN","RESTRUCTURE_RECOMMENDED"].map((o) => (
                      <option key={o}>{o.replace(/_/g," ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Amount Due (USDC)</label>
                  <input value={form.amountDue} onChange={(e) => setForm((f) => ({ ...f, amountDue: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Amount Paid (USDC)</label>
                  <input value={form.amountPaid} onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Borrower Explanation</label>
                <textarea value={form.borrowerExplanation} onChange={(e) => setForm((f) => ({ ...f, borrowerExplanation: e.target.value }))}
                  rows={3} placeholder="Explain the circumstances of the missed repayment…"
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
              </div>
              <Button onClick={handleSubmit} disabled={!form.loanId} size="sm">Submit Default Packet</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {defaults.map((d) => {
            const loan = loans.find((l) => l.id === d.loanId);
            const isReviewing = reviewing === d.id;
            return (
              <div key={d.id} className="panel p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-[#F2A93B]" />
                    <div>
                      <p className="font-heading font-bold text-[14px] text-ink">Loan {d.loanId}</p>
                      <p className="text-[11px] font-financial text-muted-ink">{d.id} · {format(new Date(d.createdAt), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  {d.outcome ? (
                    <Badge variant={OUTCOME_COLOR[d.outcome] as any}>{d.outcome.replace(/_/g," ")}</Badge>
                  ) : (
                    <Badge variant="amber">PENDING REVIEW</Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 py-3 border-y border-[rgba(17,17,17,0.08)] mb-3">
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Amount Due</p>
                    <p className="font-bold text-[13px] text-[#C8342D]">{d.amountDue}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Amount Paid</p>
                    <p className="font-bold text-[13px] text-[#2E9D68]">{d.amountPaid}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Requested</p>
                    <p className="font-bold text-[13px]">{d.requestedOutcome?.replace(/_/g," ")}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Borrower Explanation</p>
                  <p className="text-[13px] text-ink">{d.borrowerExplanation}</p>
                </div>

                {d.outcome && d.reasoning ? (
                  <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)]">
                    <p className="text-[9px] font-financial uppercase tracking-widest text-[#2457FF] mb-1">GenLayer Verdict</p>
                    <p className="text-[12px] text-ink">{d.reasoning}</p>
                  </div>
                ) : !d.outcome && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isReviewing}
                    onClick={() => handleReview(d.id)}
                  >
                    {isReviewing ? <><Loader2 size={12} className="animate-spin" /> Reviewing…</> : "Trigger GenLayer Review"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
