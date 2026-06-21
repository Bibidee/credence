"use client";

import { motion } from "framer-motion";
import type { CreditTermSheet as TermSheet } from "@/lib/genlayer/types";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function CreditTermSheet({ termSheet }: { termSheet: TermSheet }) {
  return (
    <motion.div
      className="border border-[rgba(17,17,17,0.16)] bg-[#FFF8EA]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="px-4 py-3 border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
        <span className="text-[10px] font-financial uppercase tracking-widest text-muted-ink">Loan Term Sheet</span>
        <span className="text-[9px] font-financial uppercase tracking-widest text-[rgba(17,17,17,0.3)]">GenLayer Issued</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <TermRow label="Loan Limit" value={termSheet.loanLimit} />
          <TermRow label="Min. Collateral" value={termSheet.minimumCollateral} />
          <TermRow label="Duration" value={`${termSheet.durationDays} days`} />
          <TermRow label="Repayment" value={termSheet.repaymentSchedule} />
        </div>
        <div className="pt-2 border-t border-[rgba(17,17,17,0.08)] space-y-2">
          <div className="flex items-start gap-2 text-[12px]">
            <ArrowUp size={13} className="text-[#2E9D68] mt-0.5 shrink-0" />
            <span className="text-ink">{termSheet.upgradeCondition}</span>
          </div>
          <div className="flex items-start gap-2 text-[12px]">
            <ArrowDown size={13} className="text-[#C8342D] mt-0.5 shrink-0" />
            <span className="text-ink">{termSheet.downgradeCondition}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">{label}</p>
      <p className="font-heading font-bold text-[14px] text-ink mt-0.5">{value}</p>
    </div>
  );
}
