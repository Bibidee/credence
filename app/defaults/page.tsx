"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiEvaluateDefault } from "@/lib/genlayer/contractApi";
import { formatTimestamp, shortAddress } from "@/lib/utils/format";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DefaultsPage() {
  const { defaults, loans, refreshDefault } = useCredence();
  const { address } = useWallet();
  const [txState, setTxState] = useState<Record<string, { status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string }>>({});

  async function handleEvaluate(defaultId: string) {
    setTxState(s => ({ ...s, [defaultId]: { status: "pending" } }));
    try {
      const hash = await apiEvaluateDefault(defaultId);
      await refreshDefault(defaultId);
      setTxState(s => ({ ...s, [defaultId]: { status: "success", hash } }));
    } catch (e) {
      setTxState(s => ({ ...s, [defaultId]: { status: "error", error: e instanceof Error ? e.message : "Failed" } }));
    }
  }

  return (
    <AppShell title="Defaults">
      <div className="p-6 space-y-5">
        <p className="text-[13px] text-muted-ink">{defaults.length} default review{defaults.length !== 1 ? "s" : ""}</p>

        {defaults.length === 0 ? (
          <div className="panel p-10 text-center">
            <AlertTriangle size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
            <p className="text-[13px] text-muted-ink">No default reviews yet.</p>
            <p className="text-[12px] text-muted-ink mt-1">Lenders can open a default review from an active loan page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {defaults.map(d => {
              const loan = loans.find(l => l.loan_id === d.loan_id);
              const ts = txState[d.default_review_id];
              return (
                <div key={d.default_review_id} className="panel p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[#F2A93B]" />
                      <div>
                        <p className="font-heading font-bold text-[14px]">Default Review</p>
                        <p className="text-[11px] font-financial text-muted-ink">{d.default_review_id} · {formatTimestamp(d.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant={d.status === "REVIEWED" ? (d.verdict === "DEFAULT_CURED" ? "green" : "red") : "amber"}>
                      {d.verdict ?? d.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-[13px]">
                    <div>
                      <p className="text-[9px] font-financial uppercase text-muted-ink">Loan</p>
                      <Link href={`/loans/${d.loan_id}`} className="text-[#2457FF] hover:underline text-[12px]">{d.loan_id.slice(-12)}</Link>
                    </div>
                    <div>
                      <p className="text-[9px] font-financial uppercase text-muted-ink">Opened By</p>
                      <p>{shortAddress(d.opened_by)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="text-[10px] font-financial uppercase text-muted-ink">Reason</p>
                      <p className="text-[13px]">{d.reason}</p>
                    </div>
                    {d.borrower_response && (
                      <div>
                        <p className="text-[10px] font-financial uppercase text-muted-ink">Borrower Response</p>
                        <p className="text-[13px] text-muted-ink">{d.borrower_response}</p>
                      </div>
                    )}
                  </div>

                  {d.memo && (
                    <div className="p-3 bg-[rgba(36,87,255,0.04)] border border-[rgba(36,87,255,0.12)] mb-3">
                      <p className="text-[9px] font-financial uppercase text-[#2457FF] mb-1">GenLayer Verdict Memo</p>
                      <p className="text-[12px]">{d.memo}</p>
                    </div>
                  )}

                  {ts?.status === "success" && ts.hash && (
                    <TxBanner status="success" txHash={ts.hash} message="Evaluation complete." />
                  )}
                  {ts?.status === "error" && (
                    <TxBanner status="error" error={ts.error} />
                  )}

                  {d.status === "PENDING" && (
                    <Button size="sm" onClick={() => handleEvaluate(d.default_review_id)}
                      disabled={ts?.status === "pending"}>
                      {ts?.status === "pending"
                        ? <><Loader2 size={12} className="animate-spin mr-1" /> Evaluating…</>
                        : "Trigger GenLayer Evaluation"}
                    </Button>
                  )}

                  {d.status === "REVIEWED" && d.verdict !== "DEFAULT_CONFIRMED" && (
                    <Link href={`/appeals?targetType=default&targetId=${d.default_review_id}&oldVerdict=${d.verdict}&borrowerId=${loan?.borrower_id ?? ""}`}
                      className="text-[12px] text-[#2457FF] hover:underline">
                      Appeal this decision →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
