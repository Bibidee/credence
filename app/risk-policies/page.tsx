"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { hashObject } from "@/lib/credence/evidenceHasher";
import { Shield, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import type { RiskPolicy } from "@/lib/genlayer/types";
import { motion, AnimatePresence } from "framer-motion";

const EVIDENCE_TYPES = [
  "WALLET_HISTORY_SUMMARY", "PRIOR_REPAYMENT_RECORD", "INCOME_ATTESTATION_HASH",
  "DAO_CONTRIBUTION_ATTESTATION", "EMPLOYER_ATTESTATION_HASH", "PROOF_OF_PERSONHOOD_ATTESTATION",
  "GUARANTOR_ATTESTATION", "BANK_STATEMENT_SUMMARY_HASH",
];
const LOAN_PURPOSES = ["WORKING_CAPITAL", "INVENTORY", "EDUCATION", "FREELANCE_BRIDGE", "DAO_PROJECT", "BUSINESS_EXPANSION"];
const RESTRICTED = ["GAMBLING", "SPECULATION", "ILLEGAL_ACTIVITY", "UNSPECIFIED"];

export default function RiskPoliciesPage() {
  const { policies, pools, addPolicy } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    poolId: "",
    minimumWalletAgeDays: 90,
    minimumRepayments: 0,
    maximumExposurePerBorrower: "2000",
    defaultGraceDays: 7,
    appealWindowHours: 72,
    plainTextCriteria: "",
    acceptedEvidenceTypes: [] as string[],
    allowedLoanPurposes: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  function toggleArr(key: "acceptedEvidenceTypes" | "allowedLoanPurposes", val: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }));
  }

  async function handleCreate() {
    if (!address || !form.poolId) return;
    setCreating(true);
    try {
      const policy: RiskPolicy = {
        id: `policy_${Date.now()}`,
        poolId: form.poolId,
        acceptedEvidenceTypes: form.acceptedEvidenceTypes,
        minimumWalletAgeDays: form.minimumWalletAgeDays,
        minimumRepayments: form.minimumRepayments,
        maximumExposurePerBorrower: `${form.maximumExposurePerBorrower} USDC`,
        allowedLoanPurposes: form.allowedLoanPurposes,
        restrictedLoanPurposes: RESTRICTED,
        collateralBands: {
          TIER_1_TRIAL: { min: 90, max: 100 },
          TIER_2_LIMITED: { min: 60, max: 90 },
          TIER_3_TRUSTED: { min: 35, max: 60 },
          TIER_4_HIGH_TRUST: { min: 15, max: 35 },
        },
        defaultGraceDays: form.defaultGraceDays,
        appealWindowHours: form.appealWindowHours,
        escalationTriggers: ["FRAUD_REVIEW_REQUIRED", "CRITICAL_FRAUD_RISK"],
        plainTextCriteria: form.plainTextCriteria,
      };
      addPolicy(policy);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title="Risk Policies">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{policies.length} policies registered</p>
          <Button onClick={() => setShowForm(true)} size="sm"><Plus size={13} /> New Policy</Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[15px]">New Risk Policy</h3>
                <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
              </div>

              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Lender Pool</label>
                <select value={form.poolId} onChange={(e) => setForm((f) => ({ ...f, poolId: e.target.value }))}
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                  <option value="">Select pool…</option>
                  {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Min Wallet Age (days)", key: "minimumWalletAgeDays", type: "number" },
                  { label: "Min Prior Repayments", key: "minimumRepayments", type: "number" },
                  { label: "Max Exposure per Borrower (USDC)", key: "maximumExposurePerBorrower", type: "number" },
                  { label: "Default Grace Period (days)", key: "defaultGraceDays", type: "number" },
                  { label: "Appeal Window (hours)", key: "appealWindowHours", type: "number" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">{label}</label>
                    <input type={type} value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                      className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-2">Accepted Evidence Types</label>
                <div className="flex flex-wrap gap-2">
                  {EVIDENCE_TYPES.map((et) => (
                    <button key={et} onClick={() => toggleArr("acceptedEvidenceTypes", et)}
                      className={`px-2 py-1 border text-[10px] font-financial uppercase tracking-wider transition-colors ${form.acceptedEvidenceTypes.includes(et) ? "bg-ink text-canvas border-ink" : "border-[rgba(17,17,17,0.2)] text-muted-ink"}`}>
                      {et.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-2">Allowed Loan Purposes</label>
                <div className="flex flex-wrap gap-2">
                  {LOAN_PURPOSES.map((lp) => (
                    <button key={lp} onClick={() => toggleArr("allowedLoanPurposes", lp)}
                      className={`px-2 py-1 border text-[10px] font-financial uppercase tracking-wider transition-colors ${form.allowedLoanPurposes.includes(lp) ? "bg-[#2E9D68] text-white border-[#2E9D68]" : "border-[rgba(17,17,17,0.2)] text-muted-ink"}`}>
                      {lp.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Plain-Text Credit Criteria</label>
                <textarea value={form.plainTextCriteria} onChange={(e) => setForm((f) => ({ ...f, plainTextCriteria: e.target.value }))}
                  rows={3} placeholder="Describe the credit criteria in plain English. This is what GenLayer validators will use."
                  className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
              </div>

              <Button onClick={handleCreate} disabled={creating || !form.poolId} size="sm">
                {creating ? "Registering…" : "Register Policy"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {policies.map((policy) => {
            const pool = pools.find((p) => p.id === policy.poolId);
            const isExpanded = expanded === policy.id;
            return (
              <div key={policy.id} className="panel">
                <button
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                  onClick={() => setExpanded(isExpanded ? null : policy.id)}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-[#2457FF]" />
                    <div>
                      <p className="font-heading font-bold text-[14px] text-ink">{pool?.name ?? policy.poolId}</p>
                      <p className="text-[11px] font-financial text-muted-ink">{policy.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="blue">{policy.acceptedEvidenceTypes.length} evidence types</Badge>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div className="px-5 pb-5 space-y-4 border-t border-[rgba(17,17,17,0.1)]"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div>
                          <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Min Wallet Age</p>
                          <p className="font-bold text-[13px]">{policy.minimumWalletAgeDays} days</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Min Repayments</p>
                          <p className="font-bold text-[13px]">{policy.minimumRepayments}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Max Exposure</p>
                          <p className="font-bold text-[13px]">{policy.maximumExposurePerBorrower}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Grace Period</p>
                          <p className="font-bold text-[13px]">{policy.defaultGraceDays} days</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Appeal Window</p>
                          <p className="font-bold text-[13px]">{policy.appealWindowHours}h</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Allowed Purposes</p>
                        <div className="flex flex-wrap gap-1">
                          {policy.allowedLoanPurposes.map((lp) => <Badge key={lp} variant="green">{lp.replace(/_/g," ")}</Badge>)}
                        </div>
                      </div>

                      {policy.plainTextCriteria && (
                        <div>
                          <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Credit Criteria</p>
                          <p className="text-[12px] text-ink leading-relaxed">{policy.plainTextCriteria}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Collateral Bands</p>
                        <div className="space-y-1">
                          {Object.entries(policy.collateralBands).map(([tier, band]) => (
                            <div key={tier} className="flex items-center justify-between text-[12px]">
                              <span className="text-muted-ink">{tier.replace(/_/g," ")}</span>
                              <span className="font-financial font-bold">{band.min}%–{band.max}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
