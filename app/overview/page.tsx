"use client";

import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import CreditTierBadge from "@/components/credit/CreditTierBadge";
import CreditDecisionStamp from "@/components/credit/CreditDecisionStamp";
import { useCredence } from "@/lib/context/CredenceContext";
import { shortAddress } from "@/lib/utils/format";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";

export default function OverviewPage() {
  const { reviews, loans, defaults, appeals, pools, borrowers, stats } = useCredence();

  const active = loans.filter((l) => l.status === "ACTIVE").length;
  const pending = reviews.filter((r) => r.status === "UNDER_REVIEW").length;
  const approvalRate = stats.totalReviews > 0 ? Math.round((stats.approvedCount / stats.totalReviews) * 100) : 0;

  return (
    <AppShell title="Overview">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Active Loan Requests" value={active} accent="blue" />
          <StatCard label="Pending GenLayer Reviews" value={pending} accent="amber" />
          <StatCard label="Approval Rate" value={`${approvalRate}%`} accent="green" />
          <StatCard label="Avg Collateral Ratio" value={`${stats.avgCollateralRatio}%`} accent="gold" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Borrowers" value={stats.totalBorrowers} />
          <StatCard label="Defaults Under Review" value={defaults.filter((d) => !d.outcome).length} accent="red" />
          <StatCard label="Appeal Reversal Rate" value={stats.totalAppeals > 0 ? `${Math.round((stats.appealReversals / stats.totalAppeals) * 100)}%` : "—"} accent="blue" />
          <StatCard label="Lender Pools" value={pools.length} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Recent Credit Reviews */}
          <div className="panel">
            <div className="px-4 py-3 border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Recent Credit Reviews</p>
              <Link href="/credit-reviews" className="text-[11px] text-[#2457FF] flex items-center gap-1 hover:underline">
                All <ArrowRight size={10} />
              </Link>
            </div>
            <table className="w-full ledger-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Pool</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {reviews.slice(0, 4).map((r) => {
                  const borrower = borrowers.find((b) => b.id === r.borrowerId);
                  const pool = pools.find((p) => p.id === r.poolId);
                  return (
                    <tr key={r.id}>
                      <td className="font-financial text-[11px]">
                        <Link href={`/credit-reviews/${r.id}`} className="hover:text-[#2457FF] transition-colors">
                          {borrower?.alias ?? shortAddress(r.borrowerId)}
                        </Link>
                      </td>
                      <td className="text-[12px] text-muted-ink">{pool?.name ?? r.poolId}</td>
                      <td>
                        <Badge variant={r.status === "REVIEWED" ? "green" : r.status === "UNDER_REVIEW" ? "amber" : "grey"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td>
                        {r.verdict ? (
                          <CreditDecisionStamp decision={r.verdict.decision} />
                        ) : (
                          <span className="text-[11px] text-muted-ink">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Borrower Tier Summary */}
          <div className="panel">
            <div className="px-4 py-3 border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Borrower Credit Tiers</p>
              <Link href="/borrower-passport" className="text-[11px] text-[#2457FF] flex items-center gap-1 hover:underline">
                Passport <ArrowRight size={10} />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {borrowers.map((b) => (
                <div key={b.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-financial text-[13px] font-bold text-ink">{b.alias}</p>
                    <p className="text-[11px] text-muted-ink">{shortAddress(b.wallet)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px] text-muted-ink">
                      <span>{b.successfulRepayments} repaid</span>
                    </div>
                    <CreditTierBadge tier={b.currentTier} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Defaults alert */}
        {defaults.some((d) => !d.outcome) && (
          <div className="border border-[rgba(200,52,45,0.2)] bg-[rgba(200,52,45,0.04)] px-4 py-3 flex items-center gap-3">
            <AlertTriangle size={14} className="text-[#C8342D] shrink-0" />
            <div className="flex-1">
              <span className="text-[13px] text-ink font-medium">
                {defaults.filter((d) => !d.outcome).length} default review(s) pending GenLayer decision.
              </span>
              <span className="text-[12px] text-muted-ink ml-2">Borrowers have submitted explanations awaiting consensus.</span>
            </div>
            <Link href="/defaults" className="text-[12px] text-[#C8342D] hover:underline flex items-center gap-1">
              Review <ArrowRight size={11} />
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
