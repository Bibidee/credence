"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import GenLayerCreditReviewPanel from "@/components/credit/GenLayerCreditReviewPanel";
import CreditTierBadge from "@/components/credit/CreditTierBadge";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useCredence } from "@/lib/context/CredenceContext";
import { shortAddress } from "@/lib/utils/format";
import { ArrowLeft, FileText, Scale } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function CreditReviewDetailPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = use(params);
  const router = useRouter();
  const { reviews, borrowers, pools, policies, addAppeal, updateReview } = useCredence();

  const review = reviews.find((r) => r.id === reviewId);
  const borrower = borrowers.find((b) => b.id === review?.borrowerId);
  const pool = pools.find((p) => p.id === review?.poolId);
  const policy = policies.find((p) => p.poolId === review?.poolId);

  if (!review) {
    return (
      <AppShell title="Credit Review">
        <div className="p-6 text-center mt-20">
          <p className="text-muted-ink">Review not found.</p>
          <Link href="/credit-reviews" className="text-[#2457FF] hover:underline mt-2 inline-block">← Back</Link>
        </div>
      </AppShell>
    );
  }

  async function handleTriggerReview() {
    updateReview(reviewId, { status: "UNDER_REVIEW" });
    await new Promise((r) => setTimeout(r, 5000));
    updateReview(reviewId, {
      status: "REVIEWED",
      verdict: {
        decision: "APPROVED_LIMITED_CREDIT",
        creditTier: "TIER_2_LIMITED",
        recommendedCollateralRatio: 70,
        maxApprovedAmount: "500 USDC",
        interestRiskBand: "MEDIUM",
        confidence: 0.74,
        repaymentCapacity: "MODERATE",
        identityConfidence: "MEDIUM",
        reputationStrength: "MEDIUM",
        fraudRisk: "LOW",
        reasoning: "The borrower has a reasonable wallet history and a credible loan purpose. Evidence supports a limited under-collateralized loan under the pool's risk policy. The requested tier and amount are within acceptable bounds. Full approval is not warranted given the limited repayment history.",
        termSheet: {
          loanLimit: "500 USDC",
          minimumCollateral: "350 USDC",
          durationDays: 30,
          repaymentSchedule: "Single repayment at maturity",
          upgradeCondition: "Repay on time to qualify for Tier 3 review.",
          downgradeCondition: "Missed repayment or unresolved default triggers review.",
        },
        riskNotes: [
          "Limited repayment history",
          "Income attestation not externally verified",
          "Requested amount within pool limits",
        ],
        privacyNotes: "Raw identity documents were not stored on-chain. Only attestation hashes and summaries were considered.",
        appealAvailable: true,
      },
    });
  }

  return (
    <AppShell title="Credit Review">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/credit-reviews" className="text-muted-ink hover:text-ink">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="font-financial text-[11px] text-muted-ink uppercase tracking-widest">{review.id}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={review.status === "REVIEWED" ? "green" : review.status === "UNDER_REVIEW" ? "amber" : "grey"}>
                {review.status}
              </Badge>
              <span className="text-[12px] text-muted-ink">
                {format(new Date(review.createdAt), "dd MMM yyyy HH:mm")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Borrower summary */}
          <div className="panel p-4">
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-3">Borrower</p>
            {borrower ? (
              <div>
                <p className="font-heading font-bold text-[15px] text-ink">{borrower.alias}</p>
                <p className="text-[11px] font-financial text-muted-ink mt-0.5">{shortAddress(borrower.wallet)}</p>
                <div className="mt-3">
                  <CreditTierBadge tier={borrower.currentTier} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-muted-ink">Repayments</p>
                    <p className="font-bold">{borrower.successfulRepayments}</p>
                  </div>
                  <div>
                    <p className="text-muted-ink">Defaults</p>
                    <p className="font-bold">{borrower.defaults}</p>
                  </div>
                </div>
              </div>
            ) : <p className="text-[12px] text-muted-ink">{review.borrowerId}</p>}
          </div>

          {/* Pool */}
          <div className="panel p-4">
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-3">Lender Pool</p>
            {pool ? (
              <div>
                <p className="font-heading font-bold text-[15px] text-ink">{pool.name}</p>
                <p className="text-[11px] text-muted-ink mt-1">Max: {pool.maxLoanAmount}</p>
                <p className="text-[11px] text-muted-ink">Asset: {pool.asset}</p>
                <p className="text-[11px] text-muted-ink">Risk: {pool.riskAppetite}</p>
              </div>
            ) : <p className="text-[12px] text-muted-ink">{review.poolId}</p>}
          </div>

          {/* Hashes */}
          <div className="panel p-4">
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-3">Packet Hashes</p>
            <div className="space-y-2">
              <div>
                <p className="text-[9px] text-muted-ink">Reputation Packet</p>
                <p className="font-mono text-[10px] text-ink break-all">{review.reputationPacketHash.slice(0, 20)}…</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-ink">Evidence</p>
                <p className="font-mono text-[10px] text-ink break-all">{review.evidenceHash.slice(0, 20)}…</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk policy */}
        {policy && (
          <div className="panel p-4">
            <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-2">Lender Risk Policy</p>
            <p className="text-[13px] text-ink leading-relaxed">{policy.plainTextCriteria || "Standard risk policy applied."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {policy.allowedLoanPurposes.map((lp) => <Badge key={lp} variant="green">{lp.replace(/_/g," ")}</Badge>)}
            </div>
          </div>
        )}

        {/* GenLayer review panel */}
        <div className="panel p-5">
          <GenLayerCreditReviewPanel
            reviewId={review.id}
            verdict={review.verdict}
            onTriggerReview={review.status === "SUBMITTED" ? handleTriggerReview : undefined}
          />
        </div>

        {/* Appeal option */}
        {review.verdict?.appealAvailable && review.status === "REVIEWED" && (
          <div className="panel p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={14} className="text-[#2457FF]" />
              <div>
                <p className="text-[13px] font-medium text-ink">Appeal available</p>
                <p className="text-[11px] text-muted-ink">Disagree with this verdict? Submit additional evidence to request re-review.</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/appeals?reviewId=${review.id}`)}
            >
              <Scale size={12} /> File Appeal
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
