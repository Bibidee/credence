"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiDrawLoan, apiRepayLoan, apiOpenDefault } from "@/lib/genlayer/contractApi";
import { formatGEN, genToWei, formatTimestamp, loanStatusColor, explorerAddress, shortAddress } from "@/lib/utils/format";
import { Landmark, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const router = useRouter();
  const { loans, pools, borrowers, defaults, registerLoanId, registerDefaultId, refreshLoan, refreshDefault, refreshPool } = useCredence();
  const { address } = useWallet();
  const loan = loans.find(l => l.loan_id === loanId);
  const pool = pools.find(p => p.pool_id === loan?.pool_id);
  const borrower = borrowers.find(b => b.borrower_id === loan?.borrower_id);
  const loanDefault = defaults.find(d => d.loan_id === loanId);

  const [repayAmount, setRepayAmount] = useState("");
  const [defaultForm, setDefaultForm] = useState({ reason: "", response: "" });
  const [showDefaultForm, setShowDefaultForm] = useState(false);
  const [txState, setTxState] = useState<{ status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string; msg?: string }>({ status: "idle" });

  useEffect(() => {
    if (!loan) { registerLoanId(loanId); refreshLoan(loanId); }
  }, [loanId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isBorrower = address?.toLowerCase() === loan?.borrower_address?.toLowerCase();
  const isLender = address?.toLowerCase() === loan?.lender_address?.toLowerCase();
  const canDraw = loan?.status === "APPROVED_NOT_DRAWN" && isBorrower;
  const canRepay = ["ACTIVE","PARTIALLY_REPAID","OVERDUE"].includes(loan?.status ?? "") && isBorrower;
  const canOpenDefault = ["ACTIVE","OVERDUE","PARTIALLY_REPAID"].includes(loan?.status ?? "") && isLender && !loanDefault;

  async function handleDraw() {
    if (!loan) return;
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiDrawLoan(loanId);
      await Promise.all([refreshLoan(loanId), refreshPool(loan.pool_id)]);
      setTxState({ status: "success", hash, msg: `Loan drawn — ${formatGEN(loan.principal_native)} reserved for you.` });
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Draw failed" });
    }
  }

  async function handleRepay() {
    if (!loan || !repayAmount) return;
    const wei = genToWei(repayAmount);
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiRepayLoan(loanId, wei);
      await Promise.all([refreshLoan(loanId), refreshPool(loan.pool_id)]);
      setTxState({ status: "success", hash, msg: `Repaid ${repayAmount} GEN. Pool liquidity restored.` });
      setRepayAmount("");
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Repayment failed" });
    }
  }

  async function handleOpenDefault() {
    if (!loan || !defaultForm.reason) return;
    const defaultId = `default_${Date.now()}`;
    setTxState({ status: "pending", msg: "Opening default review…" });
    try {
      const hash = await apiOpenDefault(defaultId, loanId, defaultForm.reason, defaultForm.response);
      registerDefaultId(defaultId);
      await Promise.all([refreshDefault(defaultId), refreshLoan(loanId)]);
      setTxState({ status: "success", hash, msg: "Default review opened." });
      setShowDefaultForm(false);
      router.push(`/defaults/${defaultId}`);
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Failed to open default review" });
    }
  }

  if (!loan) return (
    <AppShell title="Loan">
      <div className="p-6 flex items-center gap-2 text-muted-ink text-[13px]">
        <Loader2 size={14} className="animate-spin" /> Loading loan…
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Loan">
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Landmark size={20} className="text-[#D6A84F]" />
            <div>
              <h2 className="font-heading font-bold text-[18px] text-ink">Loan</h2>
              <p className="text-[11px] font-financial text-muted-ink">{loan.loan_id}</p>
            </div>
          </div>
          <Badge variant={loanStatusColor(loan.status) as any}>{loan.status.replace(/_/g," ")}</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Principal", value: formatGEN(loan.principal_native), color: "" },
            { label: "Drawn", value: formatGEN(loan.drawn_amount_native), color: "" },
            { label: "Repaid", value: formatGEN(loan.repaid_amount_native), color: "text-[#2E9D68]" },
            { label: "Outstanding", value: formatGEN(loan.outstanding_amount_native), color: "text-[#C8342D]" },
          ].map(s => (
            <div key={s.label} className="panel p-4">
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">{s.label}</p>
              <p className={`font-bold text-[16px] mt-1 ${s.color || "text-ink"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Parties */}
        <div className="panel p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Borrower</p>
            <p className="font-medium text-[13px]">{borrower?.borrower_name ?? "—"}</p>
            <a href={explorerAddress(loan.borrower_address)} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-financial text-muted-ink hover:text-ink flex items-center gap-1">
              {shortAddress(loan.borrower_address)} <ExternalLink size={9} />
            </a>
          </div>
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Lender Pool</p>
            <p className="font-medium text-[13px]">{pool?.pool_name ?? "—"}</p>
            <a href={explorerAddress(loan.lender_address)} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-financial text-muted-ink hover:text-ink flex items-center gap-1">
              {shortAddress(loan.lender_address)} <ExternalLink size={9} />
            </a>
          </div>
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Due Date</p>
            <p className="text-[13px]">{loan.due_timestamp ? formatTimestamp(loan.due_timestamp) : "Not yet active"}</p>
          </div>
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Drawn At</p>
            <p className="text-[13px]">{loan.drawn_at ? formatTimestamp(loan.drawn_at) : "Not yet drawn"}</p>
          </div>
        </div>

        <TxBanner status={txState.status} message={txState.msg} txHash={txState.hash} error={txState.error} />

        {/* Draw */}
        {canDraw && (
          <div className="panel p-5 border-[rgba(36,87,255,0.2)] bg-[rgba(36,87,255,0.04)]">
            <h3 className="font-heading font-bold text-[14px] mb-2">Draw Loan</h3>
            <p className="text-[13px] text-muted-ink mb-3">
              Your loan of <strong>{formatGEN(loan.principal_native)}</strong> is approved and ready to draw.
              Confirm on-chain to mark it as active.
            </p>
            <p className="text-[11px] text-[#F2A93B] mb-3">
              Note: Native GEN transfer from contract to your wallet requires GenLayer native transfer support.
              This transaction records the drawdown on-chain. Coordinate with the lender for fund delivery if needed.
            </p>
            <Button onClick={handleDraw} disabled={txState.status === "pending"}>
              {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin mr-1" /> Processing…</> : `Draw ${formatGEN(loan.principal_native)}`}
            </Button>
          </div>
        )}

        {/* Repay */}
        {canRepay && (
          <div className="panel p-5">
            <h3 className="font-heading font-bold text-[14px] mb-2">Repay Loan</h3>
            <p className="text-[13px] text-muted-ink mb-3">
              Outstanding: <strong className="text-[#C8342D]">{formatGEN(loan.outstanding_amount_native)}</strong>
            </p>
            <div className="flex gap-3">
              <input type="number" value={repayAmount} onChange={e => setRepayAmount(e.target.value)}
                placeholder="Amount in GEN"
                className="flex-1 border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
              <Button onClick={handleRepay} disabled={txState.status === "pending" || !repayAmount} size="sm">
                {txState.status === "pending" ? <><Loader2 size={12} className="animate-spin" /> Repaying…</> : "Repay"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-ink mt-2">
              Sends native GEN back to the pool. Pool liquidity increases immediately.
            </p>
          </div>
        )}

        {/* Open Default */}
        {canOpenDefault && (
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-[14px]">Open Default Review</h3>
              <button onClick={() => setShowDefaultForm(v => !v)} className="text-[11px] text-[#2457FF] hover:underline">
                {showDefaultForm ? "Cancel" : "Open Review"}
              </button>
            </div>
            {showDefaultForm && (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Reason for Default Review</label>
                  <textarea value={defaultForm.reason} onChange={e => setDefaultForm(f => ({ ...f, reason: e.target.value }))}
                    rows={2} placeholder="Why are you opening a default review?" className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Borrower Response (if known)</label>
                  <textarea value={defaultForm.response} onChange={e => setDefaultForm(f => ({ ...f, response: e.target.value }))}
                    rows={2} placeholder="Any response or context from the borrower" className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
                </div>
                <Button size="sm" onClick={handleOpenDefault} disabled={txState.status === "pending" || !defaultForm.reason}>
                  {txState.status === "pending" ? "Submitting…" : "Submit Default Review"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex gap-4">
          {pool && <Link href={`/pools/${pool.pool_id}`} className="text-[12px] text-[#2457FF] hover:underline">View Pool →</Link>}
          <Link href={`/reviews/${loan.review_id}`} className="text-[12px] text-[#2457FF] hover:underline">View Review →</Link>
          {loanDefault && <Link href={`/defaults/${loanDefault.default_review_id}`} className="text-[12px] text-[#2457FF] hover:underline">View Default →</Link>}
        </div>
      </div>
    </AppShell>
  );
}
