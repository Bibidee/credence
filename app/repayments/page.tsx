"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import { useCredence } from "@/lib/context/CredenceContext";
import { Receipt, CheckCircle, Clock } from "lucide-react";
import { format, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Loan } from "@/lib/genlayer/types";

export default function RepaymentsPage() {
  const { loans, borrowers, pools } = useCredence();
  const [repaid, setRepaid] = useState<string[]>([]);

  const active = loans.filter((l) => l.status === "ACTIVE" || l.status === "LATE");
  const completed = loans.filter((l) => l.status === "REPAID");
  const totalRepaid = completed.length;
  const totalLate = loans.filter((l) => l.status === "LATE").length;

  function handleRepay(loanId: string) {
    setRepaid((prev) => [...prev, loanId]);
  }

  return (
    <AppShell title="Repayments">
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Active Loans" value={active.length} accent="blue" />
          <StatCard label="Repaid" value={totalRepaid} accent="green" />
          <StatCard label="Late" value={totalLate} accent="red" />
          <StatCard label="Repayment Rate" value={loans.length > 0 ? `${Math.round((totalRepaid / loans.length) * 100)}%` : "—"} accent="gold" />
        </div>

        {/* Active loans */}
        <div className="panel">
          <div className="px-4 py-3 border-b border-[rgba(17,17,17,0.1)]">
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Active Loan Obligations</p>
          </div>
          {active.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
              <p className="text-[13px] text-muted-ink">No active loans.</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(17,17,17,0.08)]">
              {active.map((loan) => {
                const borrower = borrowers.find((b) => b.id === loan.borrowerId);
                const pool = pools.find((p) => p.id === loan.poolId);
                const isLate = isPast(new Date(loan.dueAt)) && loan.status !== "REPAID";
                const isDone = repaid.includes(loan.id);
                return (
                  <motion.div key={loan.id} className="px-4 py-4" layout>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-heading font-bold text-[15px] text-ink">{loan.principal}</p>
                          <Badge variant={isDone ? "green" : isLate ? "red" : "blue"}>
                            {isDone ? "REPAID" : isLate ? "LATE" : "ACTIVE"}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-muted-ink">
                          {borrower?.alias} → {pool?.name}
                        </p>
                        <p className="text-[12px] text-muted-ink mt-1">
                          Collateral: <span className="text-ink font-bold">{loan.collateral}</span> ({loan.collateralRatio}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[12px] mb-2" style={{ color: isLate ? "#C8342D" : "#8B8A84" }}>
                          {isLate ? <Clock size={12} className="text-[#C8342D]" /> : <Clock size={12} />}
                          Due {format(new Date(loan.dueAt), "dd MMM yyyy")}
                        </div>
                        {!isDone ? (
                          <Button variant="gold" size="sm" onClick={() => handleRepay(loan.id)}>
                            <CheckCircle size={12} /> Mark Repaid
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 text-[#2E9D68] text-[12px]">
                            <CheckCircle size={12} /> Repaid
                          </div>
                        )}
                      </div>
                    </div>
                    {isDone && (
                      <AnimatePresence>
                        <motion.div
                          className="mt-3 p-3 bg-[rgba(46,157,104,0.06)] border border-[rgba(46,157,104,0.2)] text-[11px] text-[#2E9D68]"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                        >
                          Repayment recorded. Your on-chain reputation will be updated. Successful repayments qualify you for tier upgrade review.
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div className="panel">
            <div className="px-4 py-3 border-b border-[rgba(17,17,17,0.1)]">
              <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Completed Repayments</p>
            </div>
            <table className="w-full ledger-table">
              <thead>
                <tr><th>Loan</th><th>Principal</th><th>Pool</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {completed.map((l) => {
                  const pool = pools.find((p) => p.id === l.poolId);
                  return (
                    <tr key={l.id}>
                      <td className="font-financial text-[11px]">{l.id}</td>
                      <td className="font-bold text-[13px]">{l.principal}</td>
                      <td className="text-[12px] text-muted-ink">{pool?.name}</td>
                      <td className="text-[12px]">{format(new Date(l.dueAt), "dd MMM yyyy")}</td>
                      <td><Badge variant="green">REPAID</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="panel p-4 border-[rgba(214,168,79,0.2)] bg-[rgba(214,168,79,0.04)] text-[12px] text-muted-ink">
          Repayment tracking is deterministic. GenLayer is used only for disputes, default explanations, restructuring, and appeals — not for recording that a payment occurred.
        </div>
      </div>
    </AppShell>
  );
}
