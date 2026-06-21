"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiDepositToPool, apiCreatePolicy, apiGetPolicy } from "@/lib/genlayer/contractApi";
import { formatGEN, genToWei, shortAddress, explorerAddress } from "@/lib/utils/format";
import type { RiskPolicy } from "@/lib/genlayer/types";
import { Building2, Plus, X, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { pools, reviews, loans, registerPoolId, refreshPool } = useCredence();
  const { address } = useWallet();
  const pool = pools.find(p => p.pool_id === poolId);

  const [policy, setPolicy] = useState<RiskPolicy | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    policy_name: "",
    min_trust_score: 50,
    max_risk_band: "MEDIUM",
    max_loan_native: "",
    max_duration_days: 30,
    required_evidence: [] as string[],
    allowed_borrower_types: ["INDIVIDUAL", "DAO"],
    default_tolerance: "LOW",
    appeal_allowed: true,
    policy_notes: "",
  });
  const [txState, setTxState] = useState<{ status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string; msg?: string }>({ status: "idle" });

  const poolReviews = reviews.filter(r => r.pool_id === poolId);
  const poolLoans = loans.filter(l => l.pool_id === poolId);
  const isOwner = address?.toLowerCase() === pool?.lender_address?.toLowerCase();

  useEffect(() => {
    if (!pool) { registerPoolId(poolId); refreshPool(poolId); }
  }, [poolId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pool?.policy_id) {
      apiGetPolicy(pool.policy_id).then(p => setPolicy(p));
    }
  }, [pool?.policy_id]);

  async function handleDeposit() {
    if (!address || !depositAmount || !pool) return;
    const wei = genToWei(depositAmount);
    if (wei <= BigInt(0)) return;
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiDepositToPool(poolId, wei);
      await refreshPool(poolId);
      setTxState({ status: "success", hash, msg: `Deposited ${depositAmount} GEN into pool.` });
      setDepositAmount("");
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Deposit failed" });
    }
  }

  async function handleCreatePolicy() {
    if (!address || !pool) return;
    const policyId = `policy_${Date.now()}`;
    const policyObj = {
      ...policyForm,
      max_loan_native: genToWei(policyForm.max_loan_native || "0").toString(),
    };
    setTxState({ status: "pending", msg: "Creating risk policy…" });
    try {
      const hash = await apiCreatePolicy(poolId, policyId, policyObj);
      await refreshPool(poolId);
      const p = await apiGetPolicy(policyId);
      setPolicy(p);
      setTxState({ status: "success", hash, msg: "Risk policy attached to pool." });
      setShowPolicyForm(false);
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Policy creation failed" });
    }
  }

  if (!pool) return (
    <AppShell title="Pool">
      <div className="p-6 flex items-center gap-2 text-muted-ink text-[13px]">
        <Loader2 size={14} className="animate-spin" /> Loading pool…
      </div>
    </AppShell>
  );

  return (
    <AppShell title={pool.pool_name}>
      <div className="p-6 space-y-5 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-[#D6A84F]" />
            <div>
              <h2 className="font-heading font-bold text-[20px] text-ink">{pool.pool_name}</h2>
              <a href={explorerAddress(pool.lender_address)} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-financial text-muted-ink hover:text-ink flex items-center gap-1">
                {shortAddress(pool.lender_address)} <ExternalLink size={9} />
              </a>
              {pool.description && <p className="text-[12px] text-muted-ink mt-0.5">{pool.description}</p>}
            </div>
          </div>
          <Badge variant={pool.status === "ACTIVE" ? "green" : "amber"}>{pool.status}</Badge>
        </div>

        {/* Liquidity Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Deposited", value: formatGEN(pool.pool_native_balance) },
            { label: "Available", value: formatGEN(pool.available_native_liquidity), highlight: true },
            { label: "Total Drawn", value: formatGEN(pool.total_drawn_native) },
            { label: "Total Repaid", value: formatGEN(pool.total_repaid_native) },
          ].map(s => (
            <div key={s.label} className={`panel p-4 ${s.highlight ? "border-[rgba(46,157,104,0.3)]" : ""}`}>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">{s.label}</p>
              <p className={`font-bold text-[16px] mt-1 ${s.highlight ? "text-[#2E9D68]" : "text-ink"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <TxBanner status={txState.status} message={txState.msg} txHash={txState.hash} error={txState.error} />

        {/* Deposit */}
        {isOwner && (
          <div className="panel p-5">
            <h3 className="font-heading font-bold text-[14px] text-ink mb-3">Deposit Native GEN</h3>
            <div className="flex gap-3">
              <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                placeholder="Amount in GEN (e.g. 10)"
                className="flex-1 border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
              <Button onClick={handleDeposit} disabled={txState.status === "pending" || !depositAmount} size="sm">
                {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin" /> Depositing…</> : "Deposit GEN"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-ink mt-2">
              Sends native GEN from your wallet into the pool. Borrowers draw from this liquidity upon approval.
            </p>
          </div>
        )}

        {/* Risk Policy */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-[14px] text-ink">Risk Policy</h3>
            {isOwner && !policy && (
              <Button size="sm" variant="secondary" onClick={() => setShowPolicyForm(v => !v)}>
                <Plus size={12} /> Attach Policy
              </Button>
            )}
          </div>

          {policy ? (
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="font-medium">{policy.policy_name}</span>
                <span className="text-muted-ink text-[11px] font-financial">{policy.policy_id}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-[10px] text-muted-ink uppercase font-financial">Min Trust Score</p><p className="font-bold">{policy.min_trust_score}</p></div>
                <div><p className="text-[10px] text-muted-ink uppercase font-financial">Max Risk Band</p><p className="font-bold">{policy.max_risk_band}</p></div>
                <div><p className="text-[10px] text-muted-ink uppercase font-financial">Max Loan</p><p className="font-bold">{formatGEN(policy.max_loan_native)}</p></div>
                <div><p className="text-[10px] text-muted-ink uppercase font-financial">Max Duration</p><p className="font-bold">{policy.max_duration_days}d</p></div>
                <div><p className="text-[10px] text-muted-ink uppercase font-financial">Default Tolerance</p><p className="font-bold">{policy.default_tolerance}</p></div>
                <div><p className="text-[10px] text-muted-ink uppercase font-financial">Appeal Allowed</p><p className="font-bold">{policy.appeal_allowed ? "Yes" : "No"}</p></div>
              </div>
              {policy.policy_notes && <p className="text-[12px] text-muted-ink mt-1">{policy.policy_notes}</p>}
            </div>
          ) : (
            <p className="text-[13px] text-muted-ink">No risk policy attached. {isOwner ? "Create one to enable credit reviews." : "Lender has not attached a policy yet."}</p>
          )}

          <AnimatePresence>
            {showPolicyForm && (
              <motion.div className="mt-4 space-y-3 pt-4 border-t border-[rgba(17,17,17,0.08)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between">
                  <span className="font-financial text-[12px] uppercase tracking-wider text-muted-ink">New Risk Policy</span>
                  <button onClick={() => setShowPolicyForm(false)}><X size={14} className="text-muted-ink" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Policy Name", key: "policy_name", type: "text" },
                    { label: "Max Loan (GEN)", key: "max_loan_native", type: "number" },
                    { label: "Min Trust Score (0–100)", key: "min_trust_score", type: "number" },
                    { label: "Max Duration (days)", key: "max_duration_days", type: "number" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">{label}</label>
                      <input type={type} value={(policyForm as any)[key]}
                        onChange={e => setPolicyForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                        className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Max Risk Band</label>
                    <select value={policyForm.max_risk_band} onChange={e => setPolicyForm(f => ({ ...f, max_risk_band: e.target.value }))}
                      className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                      {["LOW","MEDIUM","HIGH"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Default Tolerance</label>
                    <select value={policyForm.default_tolerance} onChange={e => setPolicyForm(f => ({ ...f, default_tolerance: e.target.value }))}
                      className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                      {["LOW","MEDIUM","HIGH"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Policy Notes (plain text — used by GenLayer evaluators)</label>
                  <textarea value={policyForm.policy_notes} onChange={e => setPolicyForm(f => ({ ...f, policy_notes: e.target.value }))}
                    rows={2} placeholder="Describe underwriting criteria in plain English."
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
                </div>
                <Button size="sm" onClick={handleCreatePolicy} disabled={txState.status === "pending" || !policyForm.policy_name}>
                  {txState.status === "pending" ? "Saving…" : "Save Policy"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews */}
        <div className="panel">
          <div className="px-5 py-3 border-b border-[rgba(17,17,17,0.08)] flex items-center justify-between">
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Credit Reviews ({poolReviews.length})</p>
            <Link href="/reviews/new" className="text-[11px] text-[#2457FF] hover:underline">+ Submit Review</Link>
          </div>
          {poolReviews.length === 0 ? (
            <p className="p-5 text-[13px] text-muted-ink">No reviews yet for this pool.</p>
          ) : (
            <table className="w-full ledger-table">
              <thead><tr><th>Review</th><th>Borrower</th><th>Requested</th><th>Status</th><th>Trust</th><th></th></tr></thead>
              <tbody>
                {poolReviews.map(r => (
                  <tr key={r.review_id}>
                    <td className="font-financial text-[11px]">{r.review_id.slice(-10)}</td>
                    <td className="text-[12px]">{shortAddress(r.packet?.walletAddress as string || "")}</td>
                    <td className="font-financial text-[12px]">{formatGEN(r.requested_amount_native)}</td>
                    <td><Badge variant={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "amber"}>{r.status}</Badge></td>
                    <td className="text-[12px]">{r.trust_score != null ? `${r.trust_score}/100` : "—"}</td>
                    <td><Link href={`/reviews/${r.review_id}`} className="text-[11px] text-[#2457FF] hover:underline">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Loans */}
        <div className="panel">
          <div className="px-5 py-3 border-b border-[rgba(17,17,17,0.08)]">
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Active Loans ({poolLoans.length})</p>
          </div>
          {poolLoans.length === 0 ? (
            <p className="p-5 text-[13px] text-muted-ink">No loans yet.</p>
          ) : (
            <table className="w-full ledger-table">
              <thead><tr><th>Loan</th><th>Principal</th><th>Repaid</th><th>Outstanding</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {poolLoans.map(l => (
                  <tr key={l.loan_id}>
                    <td className="font-financial text-[11px]">{l.loan_id.slice(-10)}</td>
                    <td className="font-bold text-[13px]">{formatGEN(l.principal_native)}</td>
                    <td className="text-[12px] text-[#2E9D68]">{formatGEN(l.repaid_amount_native)}</td>
                    <td className="text-[12px] text-[#C8342D]">{formatGEN(l.outstanding_amount_native)}</td>
                    <td><Badge variant={l.status === "REPAID" ? "green" : l.status === "ACTIVE" ? "blue" : "amber"}>{l.status}</Badge></td>
                    <td><Link href={`/loans/${l.loan_id}`} className="text-[11px] text-[#2457FF] hover:underline">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
