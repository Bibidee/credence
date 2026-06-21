"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, FileText, Lock, TrendingUp, Scale } from "lucide-react";
import { useWallet } from "@/lib/context/WalletContext";

export default function LandingPage() {
  const { address, connect, isConnecting } = useWallet();

  return (
    <div className="min-h-screen bg-[#F4EFE6]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[rgba(17,17,17,0.1)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 flex items-center justify-center" style={{ background: "#D6A84F" }}>
            <Zap size={14} className="text-[#15130F]" />
          </div>
          <span className="font-heading font-bold text-[17px] tracking-tight text-ink">Credence</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/transparency" className="text-[13px] text-muted-ink hover:text-ink transition-colors">
            Transparency
          </Link>
          <Link href="/playground" className="text-[13px] text-muted-ink hover:text-ink transition-colors">
            Playground
          </Link>
          {address ? (
            <Link
              href="/overview"
              className="flex items-center gap-2 px-4 py-2 bg-ink text-canvas text-[13px] hover:bg-ledger-black transition-colors"
            >
              Open App <ArrowRight size={13} />
            </Link>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 bg-ink text-canvas text-[13px] hover:bg-ledger-black transition-colors disabled:opacity-50"
            >
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-20 pb-16 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[rgba(214,168,79,0.3)] bg-[rgba(214,168,79,0.06)] mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D6A84F]" />
            <span className="text-[10px] font-financial uppercase tracking-widest text-[#B8882A]">
              GenLayer-Native Credit Arbitration
            </span>
          </div>

          <h1 className="font-heading font-bold text-[52px] leading-[1.1] text-ink max-w-3xl mb-6">
            Credit decisions backed by reputation, not collateral alone.
          </h1>
          <p className="text-[17px] text-muted-ink max-w-2xl leading-relaxed mb-10">
            Credence uses GenLayer consensus to review borrower reputation packets, identity attestations,
            repayment history, and lender risk policies — producing explainable credit decisions for safer
            under-collateralized lending.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/overview"
              className="flex items-center gap-2 px-6 py-3 bg-ink text-canvas text-[14px] font-body hover:bg-ledger-black transition-colors"
            >
              Launch Credit Desk <ArrowRight size={15} />
            </Link>
            <Link
              href="/playground"
              className="flex items-center gap-2 px-6 py-3 border border-[rgba(17,17,17,0.2)] text-ink text-[14px] hover:border-ink transition-colors"
            >
              View Demo
            </Link>
          </div>
        </motion.div>

        {/* Mini dashboard preview */}
        <motion.div
          className="mt-16 grid grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {[
            { label: "Credit Tier", value: "TIER 2 — LIMITED", color: "#2457FF" },
            { label: "Collateral Ratio", value: "65%", color: "#D6A84F" },
            { label: "Decision", value: "APPROVED", color: "#2E9D68" },
            { label: "Confidence", value: "78%", color: "#111111" },
          ].map((item) => (
            <div key={item.label} className="panel p-4">
              <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">{item.label}</p>
              <p className="font-heading font-bold text-[15px]" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Problem */}
      <section className="px-8 py-16 border-t border-[rgba(17,17,17,0.1)] bg-[#FFF8EA]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink mb-4">The Problem</p>
          <h2 className="font-heading font-bold text-[32px] text-ink max-w-2xl mb-8">
            DeFi lending still requires too much collateral.
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                title: "Over-collateralised by default",
                desc: "Most DeFi protocols require 130%–200% collateral. A borrower who needs working capital is locked out if they cannot over-pledge assets.",
              },
              {
                title: "Reputation is invisible",
                desc: "On-chain activity, repayment history, attestations, and community standing are not weighed by existing contracts — only asset value is.",
              },
              {
                title: "Rejections lack explanation",
                desc: "When borrowers are denied, there is no reasoning, no appeal path, and no way to improve their position for a future application.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-heading font-bold text-[15px] text-ink mb-2">{item.title}</h3>
                <p className="text-[13px] text-muted-ink leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GenLayer section */}
      <section className="px-8 py-16 border-t border-[rgba(17,17,17,0.1)]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-6 h-6 flex items-center justify-center bg-[rgba(36,87,255,0.1)]">
              <Zap size={12} className="text-[#2457FF]" />
            </div>
            <p className="text-[10px] font-financial uppercase tracking-widest text-[#2457FF] mt-1">GenLayer Credit Arbitration</p>
          </div>
          <h2 className="font-heading font-bold text-[32px] text-ink max-w-2xl mb-6">
            Reputation can justify better loan terms.
          </h2>
          <p className="text-[15px] text-muted-ink max-w-2xl mb-10 leading-relaxed">
            GenLayer Intelligent Contracts can judge whether a borrower&apos;s reputation packet — identity
            attestations, repayment history, wallet behaviour, loan purpose, and lender risk policy — justifies
            reduced collateral. This is the exact category where GenLayer is stronger than deterministic contracts:
            qualitative interpretation under written criteria.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: FileText, title: "Reputation Packets", desc: "Borrowers submit structured packets with attestation hashes, on-chain history summaries, and loan-purpose context. Raw private documents stay off-chain." },
              { icon: ShieldCheck, title: "Lender Risk Policies", desc: "Lenders define explicit risk criteria: accepted evidence types, minimum wallet age, collateral bands per tier, allowed loan purposes, and escalation rules." },
              { icon: Scale, title: "Consensus Verdict", desc: "GenLayer validators review the packet against the lender policy and return a structured credit verdict with tier, collateral ratio, reasoning, and risk notes." },
              { icon: TrendingUp, title: "Repayment-Based Reputation", desc: "Successful repayments update borrower reputation and qualify them for tier upgrades. Defaults go through GenLayer review for context-aware outcomes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="panel p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={15} className="text-[#2457FF]" />
                  <h3 className="font-heading font-bold text-[14px] text-ink">{title}</h3>
                </div>
                <p className="text-[13px] text-muted-ink leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="px-8 py-16 border-t border-[rgba(17,17,17,0.1)] bg-[#15130F]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={14} className="text-[#D6A84F]" />
            <p className="text-[10px] font-financial uppercase tracking-widest text-[#D6A84F]">Privacy-Preserving</p>
          </div>
          <h2 className="font-heading font-bold text-[28px] max-w-2xl mb-4" style={{ color: "#F4EFE6" }}>
            Credence does not publish your private documents.
          </h2>
          <p className="text-[14px] max-w-xl leading-relaxed mb-8" style={{ color: "rgba(244,239,230,0.6)" }}>
            The protocol stores hashes, summaries, and GenLayer-backed credit decisions. Identity attestations
            are represented as hashes from trusted issuers. Lenders receive reasoning and risk signals,
            not sensitive personal data.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { stored: true, item: "Profile hash + wallet" },
              { stored: true, item: "Attestation hashes" },
              { stored: true, item: "Evidence summaries" },
              { stored: true, item: "Credit verdict + reasoning" },
              { stored: false, item: "Raw identity documents" },
              { stored: false, item: "Bank statements" },
              { stored: false, item: "Government ID numbers" },
              { stored: false, item: "Salary slips or tax records" },
              { stored: false, item: "Biometric data" },
            ].map((row) => (
              <div key={row.item} className="flex items-center gap-2 text-[12px]">
                <span style={{ color: row.stored ? "#2E9D68" : "#C8342D" }}>{row.stored ? "✓" : "✗"}</span>
                <span style={{ color: row.stored ? "rgba(244,239,230,0.8)" : "rgba(244,239,230,0.4)" }}>{row.item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center border-t border-[rgba(17,17,17,0.1)]">
        <h2 className="font-heading font-bold text-[36px] text-ink mb-4">
          Rule-based policy + borrower reputation + GenLayer consensus
        </h2>
        <p className="text-[16px] text-muted-ink mb-10">= Explainable creditworthiness ruling.</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/overview"
            className="flex items-center gap-2 px-8 py-4 bg-ink text-canvas text-[14px] hover:bg-ledger-black transition-colors"
          >
            Open Credit Desk <ArrowRight size={14} />
          </Link>
          <Link
            href="/playground"
            className="flex items-center gap-2 px-8 py-4 border border-[rgba(17,17,17,0.2)] text-ink text-[14px] hover:border-ink transition-colors"
          >
            Explore Playground
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-[rgba(17,17,17,0.1)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center" style={{ background: "#D6A84F" }}>
            <Zap size={11} className="text-[#15130F]" />
          </div>
          <span className="font-heading font-bold text-[13px]">Credence</span>
        </div>
        <p className="text-[11px] font-financial text-muted-ink">
          Consensus-backed creditworthiness for under-collateralized lending. Powered by GenLayer.
        </p>
      </footer>
    </div>
  );
}
