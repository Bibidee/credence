"use client";

import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { formatGEN, formatTimestamp, loanStatusColor } from "@/lib/utils/format";
import { Landmark } from "lucide-react";
import Link from "next/link";

export default function LoansPage() {
  const { loans, pools, borrowers } = useCredence();

  return (
    <AppShell title="Loans">
      <div className="p-6 space-y-5">
        <p className="text-[13px] text-muted-ink">{loans.length} loan{loans.length !== 1 ? "s" : ""} total</p>

        {loans.length === 0 ? (
          <div className="panel p-10 text-center">
            <Landmark size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
            <p className="text-[13px] text-muted-ink">No loans yet. Approved credit reviews unlock loan creation.</p>
          </div>
        ) : (
          <div className="panel">
            <table className="w-full ledger-table">
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Pool</th>
                  <th>Principal</th>
                  <th>Outstanding</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loans.map(l => {
                  const pool = pools.find(p => p.pool_id === l.pool_id);
                  const borrower = borrowers.find(b => b.borrower_id === l.borrower_id);
                  return (
                    <tr key={l.loan_id}>
                      <td>
                        <p className="font-financial text-[11px]">{l.loan_id.slice(-10)}</p>
                        <p className="text-[10px] text-muted-ink">{borrower?.borrower_name ?? l.borrower_id.slice(-8)}</p>
                      </td>
                      <td className="text-[12px] text-muted-ink">{pool?.pool_name ?? l.pool_id.slice(-10)}</td>
                      <td className="font-bold text-[13px]">{formatGEN(l.principal_native)}</td>
                      <td className="text-[12px] text-[#C8342D]">{formatGEN(l.outstanding_amount_native)}</td>
                      <td className="text-[12px]">{l.due_timestamp ? formatTimestamp(l.due_timestamp) : "—"}</td>
                      <td>
                        <Badge variant={loanStatusColor(l.status) as any}>
                          {l.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td>
                        <Link href={`/loans/${l.loan_id}`} className="text-[11px] text-[#2457FF] hover:underline">
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
