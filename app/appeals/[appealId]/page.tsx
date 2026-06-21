"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { formatTimestamp } from "@/lib/utils/format";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AppealDetailPage({ params }: { params: Promise<{ appealId: string }> }) {
  const { appealId } = use(params);
  const { appeals } = useCredence();
  const a = appeals.find((x) => x.appeal_id === appealId);

  if (!a) return <AppShell title="Appeal"><div className="p-6 text-muted-ink">Appeal not found.</div></AppShell>;

  return (
    <AppShell title="Appeal Detail">
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/appeals" className="text-muted-ink hover:text-ink"><ArrowLeft size={16} /></Link>
          <p className="font-financial text-[13px] font-bold">{a.appeal_id}</p>
          <Badge variant={a.status === "REVIEWED" ? (a.new_verdict === "APPEAL_UPHELD" ? "green" : "red") : "amber"}>
            {a.new_verdict ?? a.status}
          </Badge>
        </div>
        <div className="panel p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Target Type</p>
              <p>{a.target_type}</p>
            </div>
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Target ID</p>
              <p className="font-financial">{a.target_id.slice(-14)}</p>
            </div>
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Old Verdict</p>
              <p>{a.old_verdict}</p>
            </div>
            <div>
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">New Verdict</p>
              <p>{a.new_verdict ?? "Pending"}</p>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">New Evidence Summary</p>
            <p className="text-[13px] text-ink">{a.new_evidence_summary}</p>
          </div>
          {a.memo && (
            <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)]">
              <p className="text-[9px] font-financial uppercase tracking-widest text-[#2457FF] mb-1">GenLayer Appeal Verdict</p>
              <p className="text-[12px] text-ink">{a.memo}</p>
            </div>
          )}
          <p className="text-[11px] font-financial text-muted-ink">Filed {formatTimestamp(a.created_at)}</p>
        </div>
      </div>
    </AppShell>
  );
}
