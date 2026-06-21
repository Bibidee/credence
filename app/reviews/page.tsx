"use client";

import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useCredence } from "@/lib/context/CredenceContext";
import { formatGEN } from "@/lib/utils/format";
import { FileSearch } from "lucide-react";
import Link from "next/link";

export default function ReviewsPage() {
  const { reviews, pools } = useCredence();

  return (
    <AppShell title="Credit Reviews">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{reviews.length} review{reviews.length !== 1 ? "s" : ""} total</p>
          <Link href="/reviews/new">
            <Button size="sm">+ Submit Review</Button>
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="panel p-10 text-center">
            <FileSearch size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
            <p className="text-[13px] text-muted-ink">No credit reviews yet.</p>
            <p className="text-[12px] text-muted-ink mt-1">Register a borrower profile, then submit a reputation packet to a lender pool.</p>
          </div>
        ) : (
          <div className="panel">
            <table className="w-full ledger-table">
              <thead>
                <tr>
                  <th>Review ID</th>
                  <th>Pool</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Trust Score</th>
                  <th>Risk Band</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => {
                  const pool = pools.find(p => p.pool_id === r.pool_id);
                  return (
                    <tr key={r.review_id}>
                      <td className="font-financial text-[11px]">{r.review_id.slice(-12)}</td>
                      <td className="text-[12px] text-muted-ink">{pool?.pool_name ?? r.pool_id.slice(-10)}</td>
                      <td className="font-financial text-[12px]">{formatGEN(r.requested_amount_native)}</td>
                      <td className="font-financial text-[12px] text-[#2E9D68]">
                        {r.approved_amount_native > 0 ? formatGEN(r.approved_amount_native) : "—"}
                      </td>
                      <td className="text-[12px]">{r.trust_score != null ? `${r.trust_score}/100` : "—"}</td>
                      <td className="text-[12px]">{r.risk_band ?? "—"}</td>
                      <td>
                        <Badge variant={
                          r.status === "APPROVED" ? "green" :
                          r.status === "APPROVED_LIMITED" ? "blue" :
                          r.status === "REJECTED" ? "red" :
                          r.status === "PENDING" ? "grey" : "amber"
                        }>
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td>
                        <Link href={`/reviews/${r.review_id}`} className="text-[11px] text-[#2457FF] hover:underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
