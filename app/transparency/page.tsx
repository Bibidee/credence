"use client";

import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import { useCredence } from "@/lib/context/CredenceContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Lock } from "lucide-react";

const PIE_COLORS = ["#2E9D68", "#C8342D", "#F2A93B", "#2457FF"];

export default function TransparencyPage() {
  const { stats, reviews } = useCredence();

  const approvalRate = stats.totalReviews > 0 ? Math.round((stats.approvedCount / stats.totalReviews) * 100) : 0;
  const rejectionRate = stats.totalReviews > 0 ? Math.round((stats.rejectedCount / stats.totalReviews) * 100) : 0;
  const repaymentRate = stats.totalLoans > 0 ? Math.round((stats.totalRepaid / stats.totalLoans) * 100) : 0;
  const defaultRate = stats.totalLoans > 0 ? Math.round((stats.totalDefaults / stats.totalLoans) * 100) : 0;
  const appealRate = stats.totalReviews > 0 ? Math.round((stats.totalAppeals / stats.totalReviews) * 100) : 0;
  const appealReversalRate = stats.totalAppeals > 0 ? Math.round((stats.appealReversals / stats.totalAppeals) * 100) : 0;

  const decisionData = [
    { name: "Approved", value: stats.approvedCount },
    { name: "Rejected", value: stats.rejectedCount },
    { name: "Pending", value: stats.pendingCount },
  ];

  const tierData = [
    { tier: "Tier 1", collateral: 95, count: 1 },
    { tier: "Tier 2", collateral: 65, count: 2 },
    { tier: "Tier 3", collateral: 45, count: 1 },
  ];

  return (
    <AppShell title="Transparency">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={14} className="text-[#D6A84F]" />
          <p className="text-[12px] text-muted-ink">
            Aggregate protocol metrics only. No individual borrower data is published.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Reviews" value={stats.totalReviews} />
          <StatCard label="Approval Rate" value={`${approvalRate}%`} accent="green" />
          <StatCard label="Avg Confidence" value={`${Math.round(stats.avgConfidence * 100)}%`} accent="blue" />
          <StatCard label="Avg Collateral Ratio" value={`${stats.avgCollateralRatio}%`} accent="gold" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Repayment Rate" value={`${repaymentRate}%`} accent="green" />
          <StatCard label="Default Rate" value={`${defaultRate}%`} accent="red" />
          <StatCard label="Appeal Rate" value={`${appealRate}%`} accent="amber" />
          <StatCard label="Appeal Reversal Rate" value={`${appealReversalRate}%`} accent="blue" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Borrowers" value={stats.totalBorrowers} sub="Privacy-preserving count" />
          <StatCard label="Active Pools" value={stats.totalPools} />
          <StatCard label="Total Loans" value={stats.totalLoans} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-5">
          <div className="panel p-5">
            <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink mb-4">Decision Distribution</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={decisionData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {decisionData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="panel p-5">
            <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink mb-4">Avg Collateral Ratio by Tier</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tierData} barSize={32}>
                <XAxis dataKey="tier" tick={{ fontSize: 11, fontFamily: "Space Mono" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#FFF8EA", border: "1px solid rgba(17,17,17,0.12)", fontSize: 11 }}
                  formatter={(v) => [`${v}%`, "Avg Collateral"]}
                />
                <Bar dataKey="collateral" fill="#D6A84F" radius={[1,1,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Privacy note */}
        <div className="deep-panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={14} className="text-[#D6A84F]" />
            <p className="text-[11px] font-financial uppercase tracking-widest text-[#D6A84F]">Privacy Guarantee</p>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(244,239,230,0.75)" }}>
            This dashboard shows aggregate protocol metrics only. Borrower identities, private documents, salary
            information, government IDs, and personal attestation details are never published. The borrower count
            is privacy-preserving. Individual credit decisions are accessible only to the borrower and the lending pool.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
