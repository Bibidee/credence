"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiRegisterBorrower, apiGetBorrowerByWallet } from "@/lib/genlayer/contractApi";
import { shortAddress } from "@/lib/utils/format";
import { User, Plus, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const BORROWER_TYPES = ["INDIVIDUAL", "DAO", "FREELANCER", "SMALL_BUSINESS", "COOPERATIVE"];

export default function BorrowersPage() {
  const router = useRouter();
  const { borrowers, registerBorrowerId, refreshAll } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    borrower_name: "",
    borrower_type: "INDIVIDUAL",
    purpose_summary: "",
    wallet_history_summary: "",
    repayment_history_summary: "",
    income_or_revenue_summary: "",
    dao_or_work_history: "",
    guarantor_note: "",
  });
  const [txState, setTxState] = useState<{ status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string; msg?: string }>({ status: "idle" });

  const myProfile = borrowers.find(b => b.borrower_address?.toLowerCase() === address?.toLowerCase());

  async function handleRegister() {
    if (!address || !form.borrower_name.trim()) return;
    const borrowerId = `borrower_${Date.now()}`;
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiRegisterBorrower(borrowerId, { ...form, evidence_urls: [] });
      registerBorrowerId(borrowerId);
      await refreshAll();
      setTxState({ status: "success", hash, msg: "Borrower profile registered on GenLayer." });
      setShowForm(false);
      setTimeout(() => router.push(`/borrowers/${borrowerId}`), 1200);
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Registration failed" });
    }
  }

  return (
    <AppShell title="Borrowers">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{borrowers.length} registered borrower{borrowers.length !== 1 ? "s" : ""}</p>
          {!myProfile && address && (
            <Button onClick={() => { setShowForm(true); setTxState({ status: "idle" }); }} size="sm">
              <Plus size={13} /> Register Profile
            </Button>
          )}
        </div>

        {!address && (
          <div className="panel p-4 text-[13px] text-muted-ink">Connect your wallet to register as a borrower.</div>
        )}

        {myProfile && (
          <div className="panel p-4 border-[rgba(36,87,255,0.2)] bg-[rgba(36,87,255,0.04)] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-ink">Your profile: <span className="text-[#2457FF]">{myProfile.borrower_name}</span></p>
              <p className="text-[11px] text-muted-ink">{myProfile.repayment_count} repayments · {myProfile.default_count} defaults</p>
            </div>
            <Link href={`/borrowers/${myProfile.borrower_id}`} className="text-[11px] text-[#2457FF] hover:underline">View →</Link>
          </div>
        )}

        <TxBanner status={txState.status} message={txState.msg} txHash={txState.hash} error={txState.error} />

        <AnimatePresence>
          {showForm && (
            <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[15px]">Register Borrower Profile</h3>
                <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Full Name / Alias</label>
                  <input value={form.borrower_name} onChange={e => setForm(f => ({ ...f, borrower_name: e.target.value }))}
                    placeholder="e.g. adaeze.eth"
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Borrower Type</label>
                  <select value={form.borrower_type} onChange={e => setForm(f => ({ ...f, borrower_type: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink">
                    {BORROWER_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {[
                { key: "purpose_summary", label: "Borrowing Purpose Summary", placeholder: "What are you borrowing for?" },
                { key: "wallet_history_summary", label: "Wallet History Summary", placeholder: "e.g. Active since 2021, 50+ transactions, no suspicious patterns" },
                { key: "repayment_history_summary", label: "Repayment History", placeholder: "Prior loan repayments, on-chain or off-chain" },
                { key: "income_or_revenue_summary", label: "Income / Revenue Summary", placeholder: "Monthly income range or revenue source" },
                { key: "dao_or_work_history", label: "DAO / Work History", placeholder: "Relevant work, DAO contributions, employment" },
                { key: "guarantor_note", label: "Guarantor / Reference (optional)", placeholder: "Contact or attestation from a known party" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">{label}</label>
                  <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    rows={2} placeholder={placeholder}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
                </div>
              ))}
              <div className="text-[11px] text-muted-ink p-3 bg-[rgba(17,17,17,0.03)] border border-[rgba(17,17,17,0.08)]">
                Only summaries are stored on-chain — no raw documents, government IDs, or biometric data.
              </div>
              <Button onClick={handleRegister} disabled={txState.status === "pending" || !form.borrower_name.trim()} size="sm">
                {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin mr-1" />Registering…</> : "Register Profile"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {borrowers.length === 0 && !showForm && (
            <div className="panel p-10 text-center">
              <User size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
              <p className="text-[13px] text-muted-ink">No borrower profiles yet.</p>
            </div>
          )}
          {borrowers.map(b => (
            <Link key={b.borrower_id} href={`/borrowers/${b.borrower_id}`}
              className="panel p-4 flex items-center justify-between hover:bg-[rgba(17,17,17,0.02)] transition-colors block">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[rgba(17,17,17,0.06)] flex items-center justify-center">
                  <User size={14} className="text-muted-ink" />
                </div>
                <div>
                  <p className="font-medium text-[14px] text-ink">{b.borrower_name}</p>
                  <p className="text-[11px] font-financial text-muted-ink">{shortAddress(b.borrower_address)} · {b.borrower_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-muted-ink font-financial">REPAYMENTS</p>
                  <p className="font-bold text-[14px] text-[#2E9D68]">{b.repayment_count ?? 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-ink font-financial">DEFAULTS</p>
                  <p className="font-bold text-[14px] text-[#C8342D]">{b.default_count ?? 0}</p>
                </div>
                <Badge variant={b.status === "ACTIVE" ? "green" : "grey"}>{b.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
