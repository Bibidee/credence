"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, Activity } from "lucide-react";
import type { CreditVerdict } from "@/lib/genlayer/types";
import CreditDecisionStamp from "./CreditDecisionStamp";
import CollateralRatioMeter from "./CollateralRatioMeter";
import CreditTermSheet from "./CreditTermSheet";

type Phase = "idle" | "submitting" | "pending" | "finalized" | "error";

interface Props {
  reviewId: string;
  verdict?: CreditVerdict;
  onTriggerReview?: () => Promise<void>;
}

export default function GenLayerCreditReviewPanel({ reviewId, verdict, onTriggerReview }: Props) {
  const [phase, setPhase] = useState<Phase>(verdict ? "finalized" : "idle");
  const [error, setError] = useState<string | null>(null);

  const handleTrigger = async () => {
    if (!onTriggerReview) return;
    setPhase("submitting");
    setError(null);
    try {
      await onTriggerReview();
      setPhase("pending");
      setTimeout(() => setPhase("finalized"), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
      setPhase("error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[#2457FF]" />
          <span className="text-[11px] font-financial uppercase tracking-widest text-[#2457FF]">
            GenLayer Review — {reviewId}
          </span>
        </div>
        {phase === "idle" && onTriggerReview && (
          <button
            onClick={handleTrigger}
            className="px-3 py-1.5 bg-[#2457FF] text-white text-[11px] font-financial uppercase tracking-wider hover:bg-[#1a40d4] transition-colors"
          >
            Trigger Review
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === "idle" && !verdict && (
          <motion.div key="idle" className="panel p-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[13px] text-muted-ink">
              Trigger the GenLayer review to start AI-validator consensus on this credit packet.
            </p>
          </motion.div>
        )}

        {(phase === "submitting" || phase === "pending") && (
          <motion.div
            key="pending"
            className="deep-panel p-6 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="text-[#D6A84F] animate-spin" />
              <span className="text-[13px] font-body" style={{ color: "#F4EFE6" }}>
                {phase === "submitting" ? "Submitting to GenLayer…" : "Waiting for validator consensus…"}
              </span>
            </div>
            <div className="space-y-1">
              {["Lender risk policy loaded", "Reputation packet analysed", "Attestation confidence evaluated", "Credit tier determination in progress"].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(244,239,230,0.5)" }}>
                  <div className="w-1 h-1 rounded-full bg-[#D6A84F]" />
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" className="panel p-4 border-[#C8342D]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 text-[#C8342D]">
              <AlertCircle size={14} />
              <span className="text-[13px]">{error}</span>
            </div>
          </motion.div>
        )}

        {(phase === "finalized" || verdict) && verdict && (
          <motion.div key="finalized" className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 text-[#2E9D68] mb-2">
              <CheckCircle size={14} />
              <span className="text-[11px] font-financial uppercase tracking-widest">Consensus Reached</span>
            </div>

            <div className="panel p-4 space-y-4">
              <div className="flex items-start justify-between">
                <CreditDecisionStamp decision={verdict.decision} />
                <div className="text-right">
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Confidence</p>
                  <p className="font-heading font-bold text-xl text-ink">{Math.round(verdict.confidence * 100)}%</p>
                </div>
              </div>

              <CollateralRatioMeter ratio={verdict.recommendedCollateralRatio} />

              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Credit Tier</p>
                  <p className="font-bold text-ink">{verdict.creditTier.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Max Amount</p>
                  <p className="font-bold text-ink">{verdict.maxApprovedAmount}</p>
                </div>
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Fraud Risk</p>
                  <p className="font-bold" style={{ color: verdict.fraudRisk === "LOW" ? "#2E9D68" : verdict.fraudRisk === "HIGH" || verdict.fraudRisk === "CRITICAL" ? "#C8342D" : "#F2A93B" }}>
                    {verdict.fraudRisk}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Identity</p>
                  <p className="font-bold text-ink">{verdict.identityConfidence}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(17,17,17,0.1)]">
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Reasoning</p>
                <p className="text-[13px] text-ink leading-relaxed">{verdict.reasoning}</p>
              </div>

              {verdict.riskNotes.length > 0 && (
                <div className="pt-2 border-t border-[rgba(17,17,17,0.1)]">
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Risk Notes</p>
                  <ul className="space-y-1">
                    {verdict.riskNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-ink">
                        <span className="text-[#F2A93B] mt-0.5">—</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-[rgba(17,17,17,0.1)]">
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Privacy Notes</p>
                <p className="text-[11px] text-muted-ink italic">{verdict.privacyNotes}</p>
              </div>
            </div>

            <CreditTermSheet termSheet={verdict.termSheet} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
