"use client";

import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { formatGEN, explorerAddress, shortAddress } from "@/lib/utils/format";
import { Building2, User, FileSearch, Landmark, AlertTriangle, Scale, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function OverviewPage() {
  const { pools, borrowers, reviews, loans, defaults, appeals, loading, refreshAll } = useCredence();
  const { address } = useWallet();

  const totalDeposited = pools.reduce((s, p) => s + p.pool_native_balance, 0);
  const totalAvailable = pools.reduce((s, p) => s + p.available_native_liquidity, 0);
  const totalDrawn = pools.reduce((s, p) => s + p.total_drawn_native, 0);
  const totalRepaid = pools.reduce((s, p) => s + p.total_repaid_native, 0);
  const activeLoans = loans.filter(l => ["ACTIVE","PARTIALLY_REPAID"].includes(l.status));
  const pendingReviews = reviews.filter(r => r.status === "PENDING");
  const approvedReviews = reviews.filter(r => ["APPROVED","APPROVED_LIMITED"].includes(r.status));
  const pendingDefaults = defaults.filter(d => d.status === "PENDING");

  const myBorrower = borrowers.find(b => b.borrower_address?.toLowerCase() === address?.toLowerCase());
  const myPool = pools.find(p => p.lender_address?.toLowerCase() === address?.toLowerCase());
  const myLoans = loans.filter(l => l.borrower_address?.toLowerCase() === address?.toLowerCase());

  return (
    <AppShell title="Overview">
      <div className="p-6 space-y-6">

        {/* Protocol Stats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Protocol · Native GEN</p>
            <button onClick={refreshAll} disabled={loading}
              className="flex items-center gap-1 text-[11px] text-muted-ink hover:text-ink">
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Deposited", value: formatGEN(totalDeposited) },
              { label: "Available Liquidity", value: formatGEN(totalAvailable), color: "text-[#2E9D68]" },
              { label: "Total Drawn", value: formatGEN(totalDrawn) },
              { label: "Total Repaid", value: formatGEN(totalRepaid), color: "text-[#2457FF]" },
            ].map(s => (
              <div key={s.label} className="panel p-4">
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">{s.label}</p>
                <p className={`font-bold text-[18px] mt-1 ${s.color ?? "text-ink"}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Loans", value: activeLoans.length, icon: Landmark, color: "text-[#2457FF]", href: "/loans" },
            { label: "Pending Reviews", value: pendingReviews.length, icon: FileSearch, color: "text-[#F2A93B]", href: "/reviews" },
            { label: "Approved Reviews", value: approvedReviews.length, icon: FileSearch, color: "text-[#2E9D68]", href: "/reviews" },
            { label: "Lender Pools", value: pools.length, icon: Building2, color: "text-[#D6A84F]", href: "/pools" },
            { label: "Open Defaults", value: pendingDefaults.length, icon: AlertTriangle, color: "text-[#C8342D]", href: "/defaults" },
            { label: "Open Appeals", value: appeals.filter(a => a.status === "PENDING").length, icon: Scale, color: "text-[#9B59B6]", href: "/appeals" },
          ].map(s => (
            <Link key={s.label} href={s.href} className="panel p-4 hover:bg-[rgba(17,17,17,0.02)] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} className={s.color} />
                <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink">{s.label}</p>
              </div>
              <p className="font-bold text-[24px] text-ink">{s.value}</p>
            </Link>
          ))}
        </div>

        {/* Your Position */}
        {address && (
          <div className="panel p-5">
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink mb-3">Your Position</p>
            <div className="grid grid-cols-2 gap-4">
              {myBorrower ? (
                <div>
                  <p className="text-[10px] text-muted-ink mb-1">Borrower Profile</p>
                  <Link href={`/borrowers/${myBorrower.borrower_id}`} className="flex items-center gap-1 font-medium text-[13px] text-[#2457FF] hover:underline">
                    {myBorrower.borrower_name} <ExternalLink size={10} />
                  </Link>
                  <p className="text-[11px] text-muted-ink">{myBorrower.repayment_count ?? 0} repayments · {myBorrower.default_count ?? 0} defaults</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-muted-ink mb-1">Borrower Profile</p>
                  <Link href="/borrowers" className="text-[12px] text-[#2457FF] hover:underline">Register as borrower →</Link>
                </div>
              )}
              {myPool ? (
                <div>
                  <p className="text-[10px] text-muted-ink mb-1">Your Lender Pool</p>
                  <Link href={`/pools/${myPool.pool_id}`} className="flex items-center gap-1 font-medium text-[13px] text-[#2457FF] hover:underline">
                    {myPool.pool_name} <ExternalLink size={10} />
                  </Link>
                  <p className="text-[11px] text-muted-ink">{formatGEN(myPool.available_native_liquidity)} available · {myPool.active_loan_count} active loans</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-muted-ink mb-1">Lender Pool</p>
                  <Link href="/pools" className="text-[12px] text-[#2457FF] hover:underline">Create a lending pool →</Link>
                </div>
              )}
            </div>

            {myLoans.filter(l => l.status !== "REPAID").length > 0 && (
              <div className="mt-4 pt-4 border-t border-[rgba(17,17,17,0.08)]">
                <p className="text-[10px] text-muted-ink mb-2">Your Active Loans</p>
                <div className="space-y-2">
                  {myLoans.filter(l => l.status !== "REPAID").slice(0, 3).map(l => (
                    <Link key={l.loan_id} href={`/loans/${l.loan_id}`}
                      className="flex items-center justify-between text-[12px] hover:text-[#2457FF]">
                      <span className="font-financial">{l.loan_id.slice(-12)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#C8342D]">{formatGEN(l.outstanding_amount_native)} outstanding</span>
                        <Badge variant={l.status === "ACTIVE" ? "blue" : "amber"}>{l.status.replace(/_/g," ")}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="panel p-5">
          <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/pools" className="border border-[rgba(17,17,17,0.15)] p-3 hover:bg-[rgba(17,17,17,0.03)] transition-colors">
              <Building2 size={14} className="text-[#D6A84F] mb-1" />
              <p className="font-medium text-[13px]">Lender Pools</p>
              <p className="text-[11px] text-muted-ink">Create or deposit into a native GEN lending pool</p>
            </Link>
            <Link href="/borrowers" className="border border-[rgba(17,17,17,0.15)] p-3 hover:bg-[rgba(17,17,17,0.03)] transition-colors">
              <User size={14} className="text-[#2457FF] mb-1" />
              <p className="font-medium text-[13px]">Borrower Profile</p>
              <p className="text-[11px] text-muted-ink">Register and build your on-chain reputation</p>
            </Link>
            <Link href="/reviews/new" className="border border-[rgba(17,17,17,0.15)] p-3 hover:bg-[rgba(17,17,17,0.03)] transition-colors">
              <FileSearch size={14} className="text-[#2E9D68] mb-1" />
              <p className="font-medium text-[13px]">Request Credit</p>
              <p className="text-[11px] text-muted-ink">Submit reputation packet to a lender pool</p>
            </Link>
            <Link href="/defaults" className="border border-[rgba(17,17,17,0.15)] p-3 hover:bg-[rgba(17,17,17,0.03)] transition-colors">
              <AlertTriangle size={14} className="text-[#F2A93B] mb-1" />
              <p className="font-medium text-[13px]">Defaults &amp; Appeals</p>
              <p className="text-[11px] text-muted-ink">Manage disputes and GenLayer arbitration</p>
            </Link>
          </div>
        </div>

        {/* Recent Credit Reviews */}
        {reviews.length > 0 && (
          <div className="panel">
            <div className="px-5 py-3 border-b border-[rgba(17,17,17,0.08)] flex justify-between items-center">
              <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Recent Credit Reviews</p>
              <Link href="/reviews" className="text-[11px] text-[#2457FF] hover:underline">View all →</Link>
            </div>
            <table className="w-full ledger-table">
              <thead>
                <tr><th>Review</th><th>Pool</th><th>Requested</th><th>Approved</th><th>Trust</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {[...reviews].reverse().slice(0, 5).map(r => {
                  const pool = pools.find(p => p.pool_id === r.pool_id);
                  return (
                    <tr key={r.review_id}>
                      <td className="font-financial text-[11px]">{r.review_id.slice(-10)}</td>
                      <td className="text-[12px] text-muted-ink">{pool?.pool_name ?? r.pool_id.slice(-8)}</td>
                      <td className="font-financial text-[12px]">{formatGEN(r.requested_amount_native)}</td>
                      <td className="font-financial text-[12px] text-[#2E9D68]">{r.approved_amount_native > 0 ? formatGEN(r.approved_amount_native) : "—"}</td>
                      <td className="text-[12px]">{r.trust_score != null ? `${r.trust_score}/100` : "—"}</td>
                      <td>
                        <Badge variant={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "amber"}>
                          {r.status.replace(/_/g," ")}
                        </Badge>
                      </td>
                      <td><Link href={`/reviews/${r.review_id}`} className="text-[11px] text-[#2457FF] hover:underline">View →</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Defaults alert */}
        {pendingDefaults.length > 0 && (
          <div className="border border-[rgba(200,52,45,0.2)] bg-[rgba(200,52,45,0.04)] px-4 py-3 flex items-center gap-3">
            <AlertTriangle size={14} className="text-[#C8342D] shrink-0" />
            <p className="flex-1 text-[13px] text-ink font-medium">
              {pendingDefaults.length} default review{pendingDefaults.length !== 1 ? "s" : ""} pending GenLayer decision.
            </p>
            <Link href="/defaults" className="text-[12px] text-[#C8342D] hover:underline">Review →</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
