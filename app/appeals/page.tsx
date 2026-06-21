"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiSubmitAppeal, apiEvaluateAppeal } from "@/lib/genlayer/contractApi";
import { formatTimestamp } from "@/lib/utils/format";
import { Scale, Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AppealsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { appeals, refreshAppeal, registerAppealId } = useCredence();
  const { address } = useWallet();

  const prefillTargetType = (params.get("targetType") ?? "") as "review" | "default" | "";
  const prefillTargetId = params.get("targetId") ?? "";
  const prefillOldVerdict = params.get("oldVerdict") ?? "";
  const prefillBorrowerId = params.get("borrowerId") ?? "";

  const [showForm, setShowForm] = useState(!!(prefillTargetId));
  const [form, setForm] = useState({
    targetType: prefillTargetType as "review" | "default",
    targetId: prefillTargetId,
    oldVerdict: prefillOldVerdict,
    borrowerId: prefillBorrowerId,
    newEvidenceSummary: "",
  });
  const [txState, setTxState] = useState<{ status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string; msg?: string }>({ status: "idle" });
  const [evalState, setEvalState] = useState<Record<string, { status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string }>>({});

  async function handleSubmit() {
    if (!address || !form.targetId || !form.newEvidenceSummary) return;
    const appealId = `appeal_${Date.now()}`;
    const borrowerId = form.borrowerId || prefillBorrowerId;
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiSubmitAppeal(
        appealId, form.targetType, form.targetId, borrowerId, form.newEvidenceSummary, form.oldVerdict
      );
      registerAppealId(appealId);
      await refreshAppeal(appealId);
      setTxState({ status: "success", hash, msg: "Appeal submitted to GenLayer." });
      setShowForm(false);
      setForm({ targetType: "review", targetId: "", oldVerdict: "", borrowerId: "", newEvidenceSummary: "" });
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Submission failed" });
    }
  }

  async function handleEvaluate(appealId: string) {
    setEvalState(s => ({ ...s, [appealId]: { status: "pending" } }));
    try {
      const hash = await apiEvaluateAppeal(appealId);
      await refreshAppeal(appealId);
      setEvalState(s => ({ ...s, [appealId]: { status: "success", hash } }));
    } catch (e) {
      setEvalState(s => ({ ...s, [appealId]: { status: "error", error: e instanceof Error ? e.message : "Failed" } }));
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-ink">{appeals.length} appeal{appeals.length !== 1 ? "s" : ""} filed</p>
        <Button size="sm" onClick={() => { setShowForm(true); setTxState({ status: "idle" }); }}>
          <Plus size={13} /> File Appeal
        </Button>
      </div>

      <TxBanner status={txState.status} message={txState.msg} txHash={txState.hash} error={txState.error} />

      <AnimatePresence>
        {showForm && (
          <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-[15px]">File Appeal</h3>
              <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Target Type</label>
                <select value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value as any }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                  <option value="review">Credit Review</option>
                  <option value="default">Default Review</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Target ID</label>
                <input value={form.targetId} onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))}
                  placeholder="review_... or default_..."
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
              </div>
              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Original Verdict</label>
                <input value={form.oldVerdict} onChange={e => setForm(f => ({ ...f, oldVerdict: e.target.value }))}
                  placeholder="e.g. REJECT"
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">New Evidence Summary</label>
              <textarea value={form.newEvidenceSummary} onChange={e => setForm(f => ({ ...f, newEvidenceSummary: e.target.value }))}
                rows={4} placeholder="Describe the new context, evidence, or arguments that were not available during the original review. Be specific."
                className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
            </div>
            <Button size="sm" onClick={handleSubmit}
              disabled={txState.status === "pending" || !form.targetId || !form.newEvidenceSummary}>
              {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin mr-1" /> Submitting…</> : "Submit Appeal"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {appeals.length === 0 && !showForm && (
        <div className="panel p-10 text-center">
          <Scale size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
          <p className="text-[13px] text-muted-ink">No appeals yet.</p>
        </div>
      )}

      {appeals.map(a => {
        const ev = evalState[a.appeal_id];
        return (
          <div key={a.appeal_id} className="panel p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale size={15} className="text-[#2457FF]" />
                <div>
                  <p className="font-heading font-bold text-[14px]">Appeal — {a.target_type} / {a.target_id.slice(-12)}</p>
                  <p className="text-[11px] font-financial text-muted-ink">{a.appeal_id} · {formatTimestamp(a.created_at)}</p>
                </div>
              </div>
              <Badge variant={a.status === "REVIEWED" ? (a.new_verdict === "APPEAL_UPHELD" ? "green" : "red") : "amber"}>
                {a.new_verdict ?? a.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3 text-[12px]">
              <div><p className="text-[9px] font-financial uppercase text-muted-ink">Old Verdict</p><p>{a.old_verdict}</p></div>
              <div><p className="text-[9px] font-financial uppercase text-muted-ink">New Verdict</p><p>{a.new_verdict ?? "Pending"}</p></div>
            </div>

            <div className="mb-3">
              <p className="text-[10px] font-financial uppercase text-muted-ink">New Evidence Summary</p>
              <p className="text-[13px]">{a.new_evidence_summary}</p>
            </div>

            {a.memo && (
              <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)] mb-3">
                <p className="text-[9px] font-financial uppercase text-[#2457FF] mb-1">GenLayer Appeal Verdict</p>
                <p className="text-[12px]">{a.memo}</p>
              </div>
            )}

            {ev?.status === "success" && ev.hash && <TxBanner status="success" txHash={ev.hash} message="Appeal evaluated." />}
            {ev?.status === "error" && <TxBanner status="error" error={ev.error} />}

            {a.status === "PENDING" && (
              <Button size="sm" onClick={() => handleEvaluate(a.appeal_id)} disabled={ev?.status === "pending"}>
                {ev?.status === "pending" ? <><Loader2 size={12} className="animate-spin mr-1" /> Evaluating…</> : "Trigger GenLayer Appeal Evaluation"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AppealsPage() {
  return (
    <AppShell title="Appeals">
      <Suspense fallback={<div className="p-6 text-muted-ink text-[13px]">Loading…</div>}>
        <AppealsContent />
      </Suspense>
    </AppShell>
  );
}
