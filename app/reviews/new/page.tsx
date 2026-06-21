"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiSubmitReputationPacket } from "@/lib/genlayer/contractApi";
import { genToWei, formatGEN } from "@/lib/utils/format";
import { Loader2 } from "lucide-react";

export default function NewReviewPage() {
  const router = useRouter();
  const { pools, borrowers, registerReviewId, refreshReview } = useCredence();
  const { address } = useWallet();
  const [form, setForm] = useState({
    poolId: "",
    requestedAmountGEN: "",
    loanPurpose: "WORKING_CAPITAL",
    purposeSummary: "",
    walletHistory: "",
    repaymentHistory: "",
    incomeNote: "",
    daoNote: "",
    guarantorNote: "",
  });
  const [txState, setTxState] = useState<{ status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string; msg?: string }>({ status: "idle" });

  const myBorrower = borrowers.find(b => b.borrower_address?.toLowerCase() === address?.toLowerCase());

  async function handleSubmit() {
    if (!address || !form.poolId || !form.requestedAmountGEN || !myBorrower) return;
    const reviewId = `review_${Date.now()}`;
    const amountWei = genToWei(form.requestedAmountGEN);
    const packet = {
      walletAddress: address,
      loanPurpose: form.loanPurpose,
      purposeSummary: form.purposeSummary,
      walletHistory: form.walletHistory,
      repaymentHistory: form.repaymentHistory,
      incomeNote: form.incomeNote,
      daoNote: form.daoNote,
      guarantorNote: form.guarantorNote,
      borrowerName: myBorrower.borrower_name,
      borrowerType: myBorrower.borrower_type,
      submittedAt: new Date().toISOString(),
    };
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiSubmitReputationPacket(reviewId, myBorrower.borrower_id, form.poolId, amountWei, packet);
      registerReviewId(reviewId);
      await refreshReview(reviewId);
      setTxState({ status: "success", hash, msg: "Reputation packet submitted to GenLayer." });
      setTimeout(() => router.push(`/reviews/${reviewId}`), 1200);
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Submission failed" });
    }
  }

  return (
    <AppShell title="Submit Credit Review">
      <div className="p-6 max-w-2xl space-y-5">
        {!address && (
          <div className="panel p-4 text-[13px] text-muted-ink">Connect your wallet first.</div>
        )}
        {address && !myBorrower && (
          <div className="panel p-4 text-[13px] text-muted-ink">
            You need a <a href="/borrowers" className="text-[#2457FF] underline">borrower profile</a> before submitting a credit review.
          </div>
        )}

        {myBorrower && (
          <div className="panel p-3 border-[rgba(36,87,255,0.2)] bg-[rgba(36,87,255,0.04)] text-[12px] text-ink">
            Submitting as: <span className="font-medium">{myBorrower.borrower_name}</span> ({myBorrower.borrower_type})
          </div>
        )}

        <div className="panel p-5 space-y-4">
          <h3 className="font-heading font-bold text-[15px]">Reputation Packet</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Target Lender Pool</label>
              <select value={form.poolId} onChange={e => setForm(f => ({ ...f, poolId: e.target.value }))}
                className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                <option value="">Select pool…</option>
                {pools.filter(p => p.status === "ACTIVE").map(p => (
                  <option key={p.pool_id} value={p.pool_id}>
                    {p.pool_name} ({formatGEN(p.available_native_liquidity)} available)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Requested Amount (GEN)</label>
              <input type="number" value={form.requestedAmountGEN}
                onChange={e => setForm(f => ({ ...f, requestedAmountGEN: e.target.value }))}
                placeholder="e.g. 5"
                className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Loan Purpose</label>
              <select value={form.loanPurpose} onChange={e => setForm(f => ({ ...f, loanPurpose: e.target.value }))}
                className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                {["WORKING_CAPITAL","INVENTORY","EDUCATION","FREELANCE_BRIDGE","DAO_PROJECT","BUSINESS_EXPANSION"].map(p => (
                  <option key={p}>{p.replace(/_/g," ")}</option>
                ))}
              </select>
            </div>
          </div>

          {[
            { key: "purposeSummary", label: "Purpose Summary", placeholder: "Explain specifically why you need this loan and how you plan to use it." },
            { key: "walletHistory", label: "Wallet History", placeholder: "e.g. Active since 2021, 50+ DeFi transactions, no suspicious activity." },
            { key: "repaymentHistory", label: "Repayment History", placeholder: "Prior loan repayments, credit activity — on-chain or verified off-chain." },
            { key: "incomeNote", label: "Income / Revenue Note", placeholder: "Describe your income source or revenue, even if approximate." },
            { key: "daoNote", label: "DAO / Work History", placeholder: "Relevant employment, DAO contributions, or professional track record." },
            { key: "guarantorNote", label: "Guarantor / Reference (optional)", placeholder: "A trusted party who can attest to your creditworthiness." },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">{label}</label>
              <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                rows={2} placeholder={placeholder}
                className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
            </div>
          ))}

          <div className="p-3 bg-[rgba(17,17,17,0.03)] text-[11px] text-muted-ink border border-[rgba(17,17,17,0.08)]">
            Only summaries are stored on GenLayer — no raw documents, bank statements, or personal IDs.
            GenLayer validators evaluate this packet against the lender's risk policy.
          </div>

          <TxBanner status={txState.status} message={txState.msg} txHash={txState.hash} error={txState.error} />

          <Button onClick={handleSubmit}
            disabled={txState.status === "pending" || !form.poolId || !form.requestedAmountGEN || !myBorrower || !address}
            size="sm">
            {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin mr-1" /> Submitting…</> : "Submit Reputation Packet"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
