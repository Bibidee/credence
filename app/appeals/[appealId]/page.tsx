"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function AppealDetailPage({ params }: { params: Promise<{ appealId: string }> }) {
  const { appealId } = use(params);
  const { appeals, reviews } = useCredence();
  const a = appeals.find((x) => x.id === appealId);
  const review = reviews.find((r) => r.id === a?.reviewId);

  if (!a) return <AppShell title="Appeal"><div className="p-6 text-muted-ink">Appeal not found.</div></AppShell>;

  return (
    <AppShell title="Appeal Detail">
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/appeals" className="text-muted-ink hover:text-ink"><ArrowLeft size={16} /></Link>
          <p className="font-financial text-[13px] font-bold">{a.id}</p>
          {a.outcome ? <Badge variant="blue">{a.outcome.replace(/_/g," ")}</Badge> : <Badge variant="amber">PENDING</Badge>}
        </div>
        <div className="panel p-5 space-y-4">
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Appeal Reason</p>
            <p className="text-[13px] text-ink">{a.appealReason}</p>
          </div>
          {a.missingContext && (
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Missing Context</p>
              <p className="text-[12px] text-muted-ink">{a.missingContext}</p>
            </div>
          )}
          {a.counterEvidenceSummary && (
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Counter Evidence</p>
              <p className="text-[12px] text-muted-ink">{a.counterEvidenceSummary}</p>
            </div>
          )}
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Requested Outcome</p>
            <p className="font-bold text-[13px]">{a.requestedOutcome.replace(/_/g," ")}</p>
          </div>
          {a.reasoning && (
            <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)]">
              <p className="text-[9px] font-financial uppercase tracking-widest text-[#2457FF] mb-1">GenLayer Appeal Verdict</p>
              <p className="text-[12px] text-ink">{a.reasoning}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
