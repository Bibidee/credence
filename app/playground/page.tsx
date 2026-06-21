"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import GenLayerCreditReviewPanel from "@/components/credit/GenLayerCreditReviewPanel";
import CollateralRatioMeter from "@/components/credit/CollateralRatioMeter";
import CreditDecisionStamp from "@/components/credit/CreditDecisionStamp";
import CreditTierBadge from "@/components/credit/CreditTierBadge";
import CreditTermSheet from "@/components/credit/CreditTermSheet";
import Badge from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, ChevronRight, ChevronLeft, Activity, Lock } from "lucide-react";
import type { CreditVerdict } from "@/lib/genlayer/types";
import { SEED_REVIEWS, SEED_POOLS, SEED_POLICIES, SEED_BORROWERS } from "@/lib/credence/seed";

const STEPS = [
  "01 / Lender Risk Policy",
  "02 / Borrower Reputation Packet",
  "03 / Evidence Hashes",
  "04 / GenLayer Review Method",
  "05 / Validator Trace",
  "06 / Credit Tier Decision",
  "07 / Collateral Ratio",
  "08 / Loan Term Sheet",
  "09 / Repayment Simulation",
  "10 / Default Appeal",
  "11 / Transparency Metrics",
];

const DEMO_VERDICT: CreditVerdict = SEED_REVIEWS[0].verdict!;
const DEMO_POLICY = SEED_POLICIES[0];
const DEMO_POOL = SEED_POOLS[0];
const DEMO_BORROWER = SEED_BORROWERS[0];

const VALIDATOR_TRACE = [
  { validator: "V-1", status: "accepted", note: "Reputation packet reviewed. Lender policy matched. Approving Tier 2 at 65% collateral." },
  { validator: "V-2", status: "accepted", note: "Income attestation confidence is HIGH. Wallet history is 420 days. Fraud risk LOW. Approve." },
  { validator: "V-3", status: "accepted", note: "Loan purpose is WORKING_CAPITAL — within allowed categories. Short repayment history noted. Limited approval." },
  { validator: "V-4", status: "rejected", note: "Insufficient long-term income attestation. Recommend requesting more evidence before Tier 3." },
  { validator: "V-5", status: "accepted", note: "Overall packet credible. Collateral band 60–90% for Tier 2. 65% is within range. Approve." },
];

export default function PlaygroundPage() {
  const [step, setStep] = useState(0);

  return (
    <AppShell title="Playground">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <FlaskConical size={18} className="text-[#D6A84F]" />
          <div>
            <h2 className="font-heading font-bold text-[20px] text-ink">GenLayer Credit Arbitration Demo</h2>
            <p className="text-[12px] text-muted-ink">Step-by-step walkthrough of the complete credit review flow</p>
          </div>
        </div>

        <div className="grid grid-cols-[220px_1fr] gap-5">
          {/* Step list */}
          <div className="space-y-1">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-full text-left px-3 py-2 text-[11px] font-financial transition-colors ${
                  step === i
                    ? "bg-ink text-canvas"
                    : "text-muted-ink hover:text-ink hover:bg-[rgba(17,17,17,0.04)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="panel p-5 min-h-[500px]"
            >
              {step === 0 && (
                <div className="space-y-4">
                  <SectionHead label="01 / Lender Risk Policy" />
                  <p className="text-[13px] text-muted-ink">The lender defines explicit credit criteria that GenLayer validators evaluate the borrower against.</p>
                  <div className="space-y-3">
                    <Row label="Pool" value={DEMO_POOL.name} />
                    <Row label="Asset" value={DEMO_POOL.asset} />
                    <Row label="Max Loan" value={DEMO_POOL.maxLoanAmount} />
                    <Row label="Risk Appetite" value={DEMO_POOL.riskAppetite} />
                    <Row label="Min Wallet Age" value={`${DEMO_POLICY.minimumWalletAgeDays} days`} />
                    <Row label="Min Repayments" value={`${DEMO_POLICY.minimumRepayments}`} />
                    <Row label="Max Exposure" value={DEMO_POLICY.maximumExposurePerBorrower} />
                  </div>
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Credit Criteria</p>
                    <p className="text-[13px] text-ink bg-[rgba(17,17,17,0.03)] p-3 border border-[rgba(17,17,17,0.08)]">{DEMO_POLICY.plainTextCriteria}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Collateral Bands</p>
                    <div className="space-y-1">
                      {Object.entries(DEMO_POLICY.collateralBands).map(([tier, band]) => (
                        <div key={tier} className="flex justify-between text-[12px] font-financial">
                          <span className="text-muted-ink">{tier.replace(/_/g," ")}</span>
                          <span className="font-bold">{band.min}%–{band.max}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <SectionHead label="02 / Borrower Reputation Packet" />
                  <p className="text-[13px] text-muted-ink">The borrower submits a structured packet. Raw private documents are never included — only hashes, summaries, and attestation references.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="Borrower" value={DEMO_BORROWER.alias} />
                    <Row label="Wallet Age" value="420 days" />
                    <Row label="Prior Repayments" value="2" />
                    <Row label="Defaults" value="0" />
                    <Row label="Requested Tier" value="TIER 2 — LIMITED" />
                    <Row label="Requested Amount" value="500 USDC" />
                    <Row label="Loan Purpose" value="WORKING CAPITAL" />
                    <Row label="Duration" value="30 days" />
                  </div>
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Attestations</p>
                    <div className="space-y-2">
                      {[
                        { type: "PROOF_OF_PERSONHOOD", confidence: "HIGH" },
                        { type: "INCOME_SUMMARY", confidence: "MEDIUM" },
                        { type: "COMMUNITY_REPUTATION", confidence: "HIGH" },
                      ].map((a) => (
                        <div key={a.type} className="flex items-center justify-between p-2 bg-[rgba(17,17,17,0.03)] border border-[rgba(17,17,17,0.08)]">
                          <span className="text-[12px] font-financial">{a.type.replace(/_/g," ")}</span>
                          <Badge variant={a.confidence === "HIGH" ? "green" : "amber"}>{a.confidence}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 border border-[rgba(214,168,79,0.2)] bg-[rgba(214,168,79,0.04)] text-[11px] text-muted-ink flex items-start gap-2">
                    <Lock size={11} className="text-[#D6A84F] mt-0.5 shrink-0" />
                    Raw identity documents are not submitted. Only attestation hashes and summaries are included in the GenLayer packet.
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <SectionHead label="03 / Evidence Hashes" />
                  <p className="text-[13px] text-muted-ink">Evidence is represented as SHA-256 hashes committed on-chain. Private documents remain off-chain.</p>
                  <div className="space-y-2">
                    {[
                      { label: "Reputation Packet Hash", hash: "0x8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f" },
                      { label: "Evidence Bundle Hash", hash: "0x9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a" },
                      { label: "Identity Attestation Hash", hash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" },
                      { label: "Income Attestation Hash", hash: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1" },
                      { label: "Community Attestation Hash", hash: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2" },
                    ].map(({ label, hash }) => (
                      <div key={label} className="p-3 bg-[#15130F] font-mono">
                        <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(244,239,230,0.4)" }}>{label}</p>
                        <p className="text-[11px] break-all" style={{ color: "#D6A84F" }}>{hash}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <SectionHead label="04 / GenLayer Review Method" />
                  <p className="text-[13px] text-muted-ink">The contract calls <code className="font-mono text-[#2457FF]">review_borrower_credit(review_id)</code>. GenLayer validators receive the reputation packet and lender risk policy and independently evaluate the credit request.</p>
                  <div className="deep-panel p-4 font-mono text-[12px] space-y-2">
                    <p style={{ color: "#D6A84F" }}>def review_borrower_credit(self, review_id: str):</p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-4">review = json.loads(self.credit_reviews[review_id])</p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-4">packet = json.loads(review["reputation_packet_json"])</p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-4">policy = json.loads(self.risk_policies[review["pool_id"]])</p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-4"></p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-4">verdict = gl.eq_principle_prompt_comparative(</p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-8">f"Review this credit application. Borrower: &#123;packet&#125;. Policy: &#123;policy&#125;.",</p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-8">lambda x, y: json.loads(x)["creditTier"] == json.loads(y)["creditTier"]</p>
                    <p style={{ color: "rgba(244,239,230,0.6)" }} className="ml-4">)</p>
                    <p style={{ color: "#2E9D68" }} className="ml-4">return json.loads(verdict)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={13} className="text-[#2457FF]" />
                    <p className="text-[12px] text-muted-ink">GenLayer uses the Equivalence Principle: validators must agree on core fields (creditTier, decision, collateralRatio) within acceptable variance.</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <SectionHead label="05 / Validator Trace" />
                  <p className="text-[13px] text-muted-ink">Each GenLayer validator independently reviews the credit packet and produces a verdict. Consensus is reached when sufficient validators agree on the key outcome fields.</p>
                  <div className="space-y-2">
                    {VALIDATOR_TRACE.map((v) => (
                      <div key={v.validator} className="p-3 border border-[rgba(17,17,17,0.1)] flex items-start gap-3">
                        <div className={`px-2 py-0.5 text-[9px] font-financial font-bold ${v.status === "accepted" ? "bg-[#2E9D68] text-white" : "bg-[#C8342D] text-white"}`}>
                          {v.validator}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={v.status === "accepted" ? "green" : "red"}>{v.status.toUpperCase()}</Badge>
                          </div>
                          <p className="text-[12px] text-muted-ink">{v.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-ink">4/5 validators accepted. Consensus threshold met. Verdict finalised.</p>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <SectionHead label="06 / Credit Tier Decision" />
                  <div className="flex items-start gap-4">
                    <CreditTierBadge tier={DEMO_VERDICT.creditTier} />
                    <CreditDecisionStamp decision={DEMO_VERDICT.decision} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="Repayment Capacity" value={DEMO_VERDICT.repaymentCapacity} />
                    <Row label="Identity Confidence" value={DEMO_VERDICT.identityConfidence} />
                    <Row label="Reputation Strength" value={DEMO_VERDICT.reputationStrength} />
                    <Row label="Fraud Risk" value={DEMO_VERDICT.fraudRisk} />
                    <Row label="Confidence" value={`${Math.round(DEMO_VERDICT.confidence * 100)}%`} />
                    <Row label="Max Amount" value={DEMO_VERDICT.maxApprovedAmount} />
                  </div>
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Reasoning</p>
                    <p className="text-[13px] text-ink leading-relaxed">{DEMO_VERDICT.reasoning}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Risk Notes</p>
                    <ul className="space-y-1">
                      {DEMO_VERDICT.riskNotes.map((note, i) => (
                        <li key={i} className="text-[12px] text-muted-ink flex items-start gap-2">
                          <span className="text-[#F2A93B]">—</span>{note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <SectionHead label="07 / Collateral Ratio Recommendation" />
                  <p className="text-[13px] text-muted-ink">The collateral ratio is derived from the borrower&apos;s credit tier and the lender&apos;s policy band. GenLayer recommends where in the band the borrower sits.</p>
                  <CollateralRatioMeter ratio={DEMO_VERDICT.recommendedCollateralRatio} />
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="p-3 bg-[rgba(17,17,17,0.03)] border border-[rgba(17,17,17,0.08)]">
                      <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Tier Band</p>
                      <p className="font-bold text-[13px]">60%–90%</p>
                    </div>
                    <div className="p-3 bg-[rgba(17,17,17,0.03)] border border-[rgba(17,17,17,0.08)]">
                      <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Recommended</p>
                      <p className="font-bold text-[13px] text-[#D6A84F]">65%</p>
                    </div>
                    <div className="p-3 bg-[rgba(17,17,17,0.03)] border border-[rgba(17,17,17,0.08)]">
                      <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Collateral on 500 USDC</p>
                      <p className="font-bold text-[13px]">325 USDC</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-4">
                  <SectionHead label="08 / Loan Term Sheet" />
                  <p className="text-[13px] text-muted-ink">The term sheet is generated from the GenLayer verdict and presented to the borrower for acceptance.</p>
                  <CreditTermSheet termSheet={DEMO_VERDICT.termSheet} />
                </div>
              )}

              {step === 8 && (
                <div className="space-y-4">
                  <SectionHead label="09 / Repayment Simulation" />
                  <p className="text-[13px] text-muted-ink">Repayment is deterministic. The protocol records whether payment occurred. GenLayer is only needed for disputes, explanations, or restructuring.</p>
                  <div className="space-y-3">
                    {[
                      { event: "Loan accepted", amount: "500 USDC", date: "15 May 2026", status: "confirmed" },
                      { event: "Partial repayment", amount: "300 USDC", date: "10 Jun 2026", status: "confirmed" },
                      { event: "Final repayment", amount: "220 USDC", date: "14 Jun 2026", status: "pending" },
                    ].map((e) => (
                      <div key={e.event} className="flex items-center justify-between p-3 border border-[rgba(17,17,17,0.08)]">
                        <div>
                          <p className="text-[13px] font-medium text-ink">{e.event}</p>
                          <p className="text-[11px] text-muted-ink">{e.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-financial font-bold text-[14px]">{e.amount}</p>
                          <Badge variant={e.status === "confirmed" ? "green" : "amber"}>{e.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-[rgba(46,157,104,0.06)] border border-[rgba(46,157,104,0.2)] text-[12px] text-[#2E9D68]">
                    Successful repayment recorded. Borrower qualifies for Tier 3 review on next credit application.
                  </div>
                </div>
              )}

              {step === 9 && (
                <div className="space-y-4">
                  <SectionHead label="10 / Default Appeal Simulation" />
                  <p className="text-[13px] text-muted-ink">When a default is disputed, the borrower submits an explanation packet. GenLayer reviews context to determine the appropriate outcome.</p>
                  <div className="panel p-4 space-y-3 bg-[rgba(200,52,45,0.03)] border-[rgba(200,52,45,0.15)]">
                    <p className="text-[10px] font-financial uppercase tracking-widest text-[#C8342D]">Default Packet</p>
                    <Row label="Missed Due Date" value="14 Jun 2026" />
                    <Row label="Amount Due" value="520 USDC" />
                    <Row label="Amount Paid" value="300 USDC" />
                    <div>
                      <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Explanation</p>
                      <p className="text-[12px] text-ink">A client payment was delayed by 12 days due to a bank processing issue. Partial repayment of 300 USDC has already been made.</p>
                    </div>
                  </div>
                  <div className="panel p-4 space-y-2 bg-[rgba(36,87,255,0.03)] border-[rgba(36,87,255,0.12)]">
                    <p className="text-[10px] font-financial uppercase tracking-widest text-[#2457FF]">GenLayer Verdict — EXTENSION RECOMMENDED</p>
                    <p className="text-[12px] text-ink">The borrower has provided a credible explanation supported by partial repayment. A 7-day extension is consistent with the pool&apos;s grace period policy. No fraud signals detected.</p>
                  </div>
                </div>
              )}

              {step === 10 && (
                <div className="space-y-4">
                  <SectionHead label="11 / Transparency Metrics" />
                  <p className="text-[13px] text-muted-ink">Aggregate protocol metrics are published. No individual borrower data is exposed.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Reviews", value: "3" },
                      { label: "Approval Rate", value: "67%" },
                      { label: "Avg Collateral Ratio", value: "55%" },
                      { label: "Repayment Rate", value: "50%" },
                      { label: "Default Rate", value: "50%" },
                      { label: "Appeal Reversal Rate", value: "100%" },
                      { label: "Avg GenLayer Confidence", value: "85%" },
                      { label: "Privacy-Preserving Borrower Count", value: "3" },
                    ].map(({ label, value }) => (
                      <Row key={label} label={label} value={value} />
                    ))}
                  </div>
                  <div className="p-3 border border-[rgba(214,168,79,0.2)] bg-[rgba(214,168,79,0.04)] flex items-start gap-2">
                    <Lock size={11} className="text-[#D6A84F] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-ink">Raw identity documents were not stored on-chain. Only attestation hashes and summaries were considered. Public transparency does not expose borrower names, private identity data, or salary details.</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-[rgba(17,17,17,0.08)]">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex items-center gap-1 text-[12px] text-muted-ink hover:text-ink disabled:opacity-30"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-[11px] font-financial text-muted-ink">{step + 1} / {STEPS.length}</span>
                <button
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  disabled={step === STEPS.length - 1}
                  className="flex items-center gap-1 text-[12px] text-muted-ink hover:text-ink disabled:opacity-30"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-1 h-5 bg-[#D6A84F]" />
      <p className="font-heading font-bold text-[17px] text-ink">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">{label}</p>
      <p className="font-bold text-[13px] text-ink mt-0.5">{value}</p>
    </div>
  );
}
