"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function LoanDetailPage({ params }: { params: Promise<{ loanId: string }> }) {
  const { loanId } = use(params);
  const { loans, borrowers, pools } = useCredence();
  const loan = loans.find((l) => l.id === loanId);
  const borrower = borrowers.find((b) => b.id === loan?.borrowerId);
  const pool = pools.find((p) => p.id === loan?.poolId);

  if (!loan) return (
    <AppShell title="Loan"><div className="p-6 text-muted-ink">Loan not found.</div></AppShell>
  );

  return (
    <AppShell title="Loan Detail">
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/loan-desk" className="text-muted-ink hover:text-ink"><ArrowLeft size={16} /></Link>
          <p className="font-financial text-[13px] font-bold">{loan.id}</p>
          <Badge variant={loan.status === "REPAID" ? "green" : loan.status === "ACTIVE" ? "blue" : "red"}>
            {loan.status}
          </Badge>
        </div>
        <div className="panel p-5 grid grid-cols-2 gap-4">
          {[
            { label: "Principal", value: loan.principal },
            { label: "Collateral", value: `${loan.collateral} (${loan.collateralRatio}%)` },
            { label: "Duration", value: `${loan.durationDays} days` },
            { label: "Due Date", value: format(new Date(loan.dueAt), "dd MMM yyyy") },
            { label: "Borrower", value: borrower?.alias ?? loan.borrowerId },
            { label: "Pool", value: pool?.name ?? loan.poolId },
            { label: "Created", value: format(new Date(loan.createdAt), "dd MMM yyyy") },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">{label}</p>
              <p className="font-bold text-[14px] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
