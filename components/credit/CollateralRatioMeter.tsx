"use client";

import { motion } from "framer-motion";

export default function CollateralRatioMeter({ ratio }: { ratio: number }) {
  const color = ratio >= 80 ? "#F2A93B" : ratio >= 50 ? "#2457FF" : "#2E9D68";
  const label = ratio >= 80 ? "HIGH COLLATERAL" : ratio >= 50 ? "MODERATE" : "REDUCED";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-financial uppercase tracking-widest text-muted-ink">Collateral Ratio</span>
        <span className="font-financial text-[13px] font-bold" style={{ color }}>
          {ratio}%
        </span>
      </div>
      <div className="h-2 bg-[rgba(17,17,17,0.08)] rounded-none overflow-hidden">
        <motion.div
          className="h-full rounded-none"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${ratio}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between text-[9px] font-financial text-muted-ink">
        <span>0%</span>
        <span className="uppercase tracking-wider">{label}</span>
        <span>100%</span>
      </div>
    </div>
  );
}
