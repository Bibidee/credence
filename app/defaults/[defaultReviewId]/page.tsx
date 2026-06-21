"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DefaultDetailPage({ params }: { params: Promise<{ defaultReviewId: string }> }) {
  const { defaultReviewId } = use(params);
  const { defaults, loans } = useCredence();
  const d = defaults.find((x) => x.id === defaultReviewId);
  const loan = loans.find((l) => l.id === d?.loanId);

  if (!d) return <AppShell title="Default"><div className="p-6 text-muted-ink">Default review not found.</div></AppShell>;

  return (
    <AppShell title="Default Review">
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/defaults" className="text-muted-ink hover:text-ink"><ArrowLeft size={16} /></Link>
          <p className="font-financial text-[13px] font-bold">{d.id}</p>
          {d.outcome ? <Badge variant="amber">{d.outcome.replace(/_/g," ")}</Badge> : <Badge variant="grey">PENDING</Badge>}
        </div>
        <div className="panel p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Amount Due</p><p className="font-bold text-[14px] text-[#C8342D]">{d.amountDue}</p></div>
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Amount Paid</p><p className="font-bold text-[14px] text-[#2E9D68]">{d.amountPaid}</p></div>
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Loan</p><p className="font-bold text-[14px]">{d.loanId}</p></div>
            <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Requested</p><p className="font-bold text-[14px]">{d.requestedOutcome?.replace(/_/g," ")}</p></div>
          </div>
          <div><p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Borrower Explanation</p><p className="text-[13px] text-ink">{d.borrowerExplanation}</p></div>
          {d.reasoning && (
            <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)]">
              <p className="text-[9px] font-financial uppercase tracking-widest text-[#2457FF] mb-1">GenLayer Verdict</p>
              <p className="text-[12px] text-ink">{d.reasoning}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
