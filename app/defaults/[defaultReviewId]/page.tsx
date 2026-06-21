"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { formatGEN, formatTimestamp, shortAddress } from "@/lib/utils/format";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DefaultDetailPage({ params }: { params: Promise<{ defaultReviewId: string }> }) {
  const { defaultReviewId } = use(params);
  const { defaults, loans } = useCredence();
  const d = defaults.find((x) => x.default_review_id === defaultReviewId);
  const loan = loans.find((l) => l.loan_id === d?.loan_id);

  if (!d) return <AppShell title="Default"><div className="p-6 text-muted-ink">Default review not found.</div></AppShell>;

  return (
    <AppShell title="Default Review">
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/defaults" className="text-muted-ink hover:text-ink"><ArrowLeft size={16} /></Link>
          <p className="font-financial text-[13px] font-bold">{d.default_review_id}</p>
          <Badge variant={d.status === "REVIEWED" ? (d.verdict === "DEFAULT_CURED" ? "green" : "red") : "amber"}>
            {d.verdict ?? d.status}
          </Badge>
        </div>
        <div className="panel p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Loan</p>
              {loan ? (
                <Link href={`/loans/${loan.loan_id}`} className="text-[#2457FF] hover:underline">{loan.loan_id.slice(-14)}</Link>
              ) : (
                <p>{d.loan_id.slice(-14)}</p>
              )}
            </div>
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Opened By</p>
              <p>{shortAddress(d.opened_by)}</p>
            </div>
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Filed</p>
              <p>{formatTimestamp(d.created_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Reason</p>
            <p className="text-[13px] text-ink">{d.reason}</p>
          </div>
          {d.borrower_response && (
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Borrower Response</p>
              <p className="text-[13px] text-muted-ink">{d.borrower_response}</p>
            </div>
          )}
          {d.memo && (
            <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)]">
              <p className="text-[9px] font-financial uppercase tracking-widest text-[#2457FF] mb-1">GenLayer Verdict Memo</p>
              <p className="text-[12px] text-ink">{d.memo}</p>
            </div>
          )}
          {d.status === "REVIEWED" && d.verdict !== "DEFAULT_CONFIRMED" && (
            <Link href={`/appeals?targetType=default&targetId=${d.default_review_id}&oldVerdict=${d.verdict}&borrowerId=${loan?.borrower_id ?? ""}`}
              className="text-[12px] text-[#2457FF] hover:underline">
              Appeal this decision →
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
