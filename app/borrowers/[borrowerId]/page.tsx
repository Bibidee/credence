"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { formatGEN, shortAddress, formatTimestamp, explorerAddress } from "@/lib/utils/format";
import { User, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BorrowerDetailPage() {
  const { borrowerId } = useParams<{ borrowerId: string }>();
  const { borrowers, reviews, loans, appeals, registerBorrowerId, refreshAll } = useCredence();
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);

  useEffect(() => {
    if (!borrower) { registerBorrowerId(borrowerId); refreshAll(); }
  }, [borrowerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const myReviews = reviews.filter(r => r.borrower_id === borrowerId);
  const myLoans = loans.filter(l => l.borrower_id === borrowerId);
  const myAppeals = appeals.filter(a => a.borrower_id === borrowerId);

  if (!borrower) return (
    <AppShell title="Borrower">
      <div className="p-6 flex items-center gap-2 text-muted-ink text-[13px]">
        <Loader2 size={14} className="animate-spin" /> Loading borrower…
      </div>
    </AppShell>
  );

  return (
    <AppShell title={borrower.borrower_name}>
      <div className="p-6 space-y-5 max-w-3xl">
        {/* Header */}
        <div className="panel p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(17,17,17,0.06)] flex items-center justify-center">
                <User size={18} className="text-muted-ink" />
              </div>
              <div>
                <p className="font-heading font-bold text-[20px] text-ink">{borrower.borrower_name}</p>
                <a href={explorerAddress(borrower.borrower_address)} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-financial text-muted-ink hover:text-ink flex items-center gap-1">
                  {shortAddress(borrower.borrower_address)} <ExternalLink size={9} />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="grey">{borrower.borrower_type}</Badge>
              <Badge variant={borrower.status === "ACTIVE" ? "green" : "grey"}>{borrower.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 pt-3 border-t border-[rgba(17,17,17,0.08)]">
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Reviews</p><p className="font-bold text-[20px]">{myReviews.length}</p></div>
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Loans</p><p className="font-bold text-[20px]">{myLoans.length}</p></div>
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Repayments</p><p className="font-bold text-[20px] text-[#2E9D68]">{borrower.repayment_count ?? 0}</p></div>
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Defaults</p><p className="font-bold text-[20px] text-[#C8342D]">{borrower.default_count ?? 0}</p></div>
          </div>
        </div>

        {/* Summaries */}
        <div className="panel p-5 space-y-3">
          <h3 className="font-heading font-bold text-[14px] text-ink">Reputation Profile</h3>
          {[
            { label: "Borrowing Purpose", value: borrower.purpose_summary },
            { label: "Wallet History", value: borrower.wallet_history_summary },
            { label: "Repayment History", value: borrower.repayment_history_summary },
            { label: "Income / Revenue", value: borrower.income_or_revenue_summary },
            { label: "DAO / Work History", value: borrower.dao_or_work_history },
            { label: "Guarantor / Reference", value: borrower.guarantor_note },
          ].filter(x => x.value).map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink mb-0.5">{label}</p>
              <p className="text-[13px] text-ink">{value}</p>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div className="panel">
          <div className="px-5 py-3 border-b border-[rgba(17,17,17,0.08)] flex items-center justify-between">
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Credit Reviews ({myReviews.length})</p>
            <Link href="/reviews/new" className="text-[11px] text-[#2457FF] hover:underline">+ New Review</Link>
          </div>
          {myReviews.length === 0 ? <p className="p-5 text-[13px] text-muted-ink">No reviews yet.</p> : (
            <table className="w-full ledger-table">
              <thead><tr><th>Review</th><th>Pool</th><th>Requested</th><th>Approved</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {myReviews.map(r => (
                  <tr key={r.review_id}>
                    <td className="font-financial text-[11px]">{r.review_id.slice(-10)}</td>
                    <td className="text-[12px] text-muted-ink">{r.pool_id.slice(-12)}</td>
                    <td className="font-financial text-[12px]">{formatGEN(r.requested_amount_native)}</td>
                    <td className="font-financial text-[12px] text-[#2E9D68]">{r.approved_amount_native ? formatGEN(r.approved_amount_native) : "—"}</td>
                    <td><Badge variant={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "amber"}>{r.status}</Badge></td>
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
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Loans ({myLoans.length})</p>
          </div>
          {myLoans.length === 0 ? <p className="p-5 text-[13px] text-muted-ink">No loans yet.</p> : (
            <table className="w-full ledger-table">
              <thead><tr><th>Loan</th><th>Principal</th><th>Outstanding</th><th>Due</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {myLoans.map(l => (
                  <tr key={l.loan_id}>
                    <td className="font-financial text-[11px]">{l.loan_id.slice(-10)}</td>
                    <td className="font-bold text-[13px]">{formatGEN(l.principal_native)}</td>
                    <td className="text-[12px] text-[#C8342D]">{formatGEN(l.outstanding_amount_native)}</td>
                    <td className="text-[12px]">{l.due_timestamp ? formatTimestamp(l.due_timestamp) : "—"}</td>
                    <td><Badge variant={l.status === "REPAID" ? "green" : l.status === "ACTIVE" ? "blue" : "amber"}>{l.status.replace(/_/g," ")}</Badge></td>
                    <td><Link href={`/loans/${l.loan_id}`} className="text-[11px] text-[#2457FF] hover:underline">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Appeals */}
        {myAppeals.length > 0 && (
          <div className="panel">
            <div className="px-5 py-3 border-b border-[rgba(17,17,17,0.08)]">
              <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Appeals ({myAppeals.length})</p>
            </div>
            <table className="w-full ledger-table">
              <thead><tr><th>Appeal</th><th>Target</th><th>Old Verdict</th><th>New Verdict</th><th>Status</th></tr></thead>
              <tbody>
                {myAppeals.map(a => (
                  <tr key={a.appeal_id}>
                    <td className="font-financial text-[11px]">{a.appeal_id.slice(-10)}</td>
                    <td className="text-[12px] text-muted-ink">{a.target_type} / {a.target_id.slice(-8)}</td>
                    <td className="text-[12px]">{a.old_verdict}</td>
                    <td className="text-[12px]">{a.new_verdict ?? "—"}</td>
                    <td><Badge variant={a.status === "REVIEWED" ? "green" : "amber"}>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
