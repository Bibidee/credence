"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { getClientReady } from "@/lib/genlayer/client";
import { getContractAddress } from "@/lib/genlayer/contract";
import { waitForTx } from "@/lib/genlayer/txWaiter";
import { AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import type { DefaultReview } from "@/lib/genlayer/types";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const OUTCOME_COLOR: Record<string, string> = {
  DEFAULT_CONFIRMED: "red", EXTENSION_RECOMMENDED: "amber", PARTIAL_REPAYMENT_PLAN: "amber",
  RESTRUCTURE_RECOMMENDED: "blue", BORROWER_EXPLANATION_ACCEPTED: "green",
  FRAUD_REVIEW_REQUIRED: "red", LENDER_ERROR: "grey", NEEDS_MORE_CONTEXT: "grey",
};

export default function DefaultsPage() {
  const { defaults, loans, addDefault, updateDefault } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    loanId: "", amountDue: "", amountPaid: "",
    borrowerExplanation: "", requestedOutcome: "EXTENSION_RECOMMENDED",
  });

  async function handleSubmit() {
    if (!address || !form.loanId) return;
    setSubmitting(true);
    setError(null);
    setTxStatus("Waiting for wallet signature…");
    try {
      const defaultId = `default_${Date.now()}`;
      const defaultPacket = JSON.stringify({
        amountDue: `${form.amountDue} USDC`,
        amountPaid: `${form.amountPaid} USDC`,
        borrowerExplanation: form.borrowerExplanation,
        requestedOutcome: form.requestedOutcome,
        reportedAt: new Date().toISOString(),
      });

      const client = await getClientReady();
      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "report_default",
        args: [defaultId, form.loanId, defaultPacket],
        account: address,
      });

      setTxStatus("Submitted — waiting for GenLayer consensus…");
      await waitForTx(txHash as `0x${string}`);

      const d: DefaultReview = {
        id: defaultId,
        loanId: form.loanId,
        missedDueDate: new Date().toISOString(),
        amountDue: `${form.amountDue} USDC`,
        amountPaid: `${form.amountPaid} USDC`,
        borrowerExplanation: form.borrowerExplanation,
        supportingEvidenceHashes: [],
        requestedOutcome: form.requestedOutcome,
        createdAt: new Date().toISOString(),
      };
      addDefault(d);
      setShowForm(false);
      setTxStatus(null);
      setForm({ loanId: "", amountDue: "", amountPaid: "", borrowerExplanation: "", requestedOutcome: "EXTENSION_RECOMMENDED" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(d: DefaultReview) {
    if (!address) return;
    setReviewing(d.id);
    setError(null);
    try {
      const client = await getClientReady();
      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "review_default",
        args: [d.id],
        account: address,
      });

      await waitForTx(txHash as `0x${string}`);

      const result = await (client as any).readContract({
        address: getContractAddress(),
        functionName: "get_default_review",
        args: [d.id],
      });

      const data = JSON.parse(typeof result === "string" ? result : JSON.stringify(result));
      if (data.outcome) {
        updateDefault(d.id, { outcome: data.outcome, reasoning: data.reasoning });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewing(null);
    }
  }

  return (
    <AppShell title="Defaults">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{defaults.length} default reviews</p>
          <Button onClick={() => { setShowForm(true); setError(null); }} size="sm"><Plus size={13} /> Report Default</Button>
        </div>

        {error && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}

        <AnimatePresence>
          {showForm && (
            <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[15px]">Report Default for Review</h3>
                <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Loan</label>
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
              {txStatus && <p className="text-[12px] text-[#2457FF] font-financial">{txStatus}</p>}
              {error && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}
              <Button onClick={handleSubmit} disabled={submitting || !form.loanId} size="sm">
                {submitting ? txStatus ?? "Processing…" : "Submit Default Packet"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {defaults.length === 0 && !showForm && (
            <div className="panel p-10 text-center text-muted-ink text-[13px]">No default reviews yet.</div>
          )}
          {defaults.map((d) => {
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
                  ) : <Badge variant="amber">PENDING REVIEW</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-4 py-3 border-y border-[rgba(17,17,17,0.08)] mb-3">
                  <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Amount Due</p><p className="font-bold text-[13px] text-[#C8342D]">{d.amountDue}</p></div>
                  <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Amount Paid</p><p className="font-bold text-[13px] text-[#2E9D68]">{d.amountPaid}</p></div>
                  <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Requested</p><p className="font-bold text-[13px]">{d.requestedOutcome?.replace(/_/g," ")}</p></div>
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
                  <Button size="sm" variant="secondary" disabled={isReviewing || !address} onClick={() => handleReview(d)}>
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
