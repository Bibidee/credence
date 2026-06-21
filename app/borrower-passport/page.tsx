"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import CreditTierBadge from "@/components/credit/CreditTierBadge";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useWallet } from "@/lib/context/WalletContext";
import { useCredence } from "@/lib/context/CredenceContext";
import { shortAddress } from "@/lib/utils/format";
import { hashObject } from "@/lib/credence/evidenceHasher";
import { getClientReady } from "@/lib/genlayer/client";
import { getContractAddress } from "@/lib/genlayer/contract";
import { waitForTx } from "@/lib/genlayer/txWaiter";
import { User, Lock, CheckCircle, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import type { Borrower } from "@/lib/genlayer/types";

export default function BorrowerPassportPage() {
  const { address } = useWallet();
  const { borrowers, reviews, appeals, addBorrower } = useCredence();
  const [alias, setAlias] = useState("");
  const [creating, setCreating] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = borrowers.find((b) => b.wallet.toLowerCase() === address?.toLowerCase());
  const myReviews = reviews.filter((r) => r.borrowerId === connected?.id);
  const myAppeals = appeals.filter((a) => myReviews.some((r) => r.id === a.reviewId));

  async function handleCreate() {
    if (!address || !alias.trim()) return;
    setCreating(true);
    setError(null);
    setTxStatus("Preparing transaction…");
    try {
      const borrowerId = `borrower_${Date.now()}`;
      const profileHash = await hashObject({ wallet: address, alias, createdAt: new Date().toISOString() });
      const profileJson = JSON.stringify({ wallet: address, alias: alias.trim() });

      const client = await getClientReady();
      setTxStatus("Waiting for wallet signature…");

      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "register_borrower",
        args: [borrowerId, profileJson, profileHash],
      });

      setTxStatus("Submitted — waiting for GenLayer consensus…");
      await waitForTx(txHash as `0x${string}`);

      const borrower: Borrower = {
        id: borrowerId,
        wallet: address,
        alias: alias.trim(),
        profileHash,
        currentTier: "TIER_0_UNREVIEWED",
        reviewCount: 0,
        successfulRepayments: 0,
        defaults: 0,
        createdAt: new Date().toISOString(),
      };
      addBorrower(borrower);
      setTxStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setCreating(false);
    }
  }

  if (!address) {
    return (
      <AppShell title="Borrower Passport">
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <User size={40} className="text-[rgba(17,17,17,0.15)] mb-4" />
          <p className="font-heading font-bold text-[18px] text-ink mb-2">Connect your wallet to view your passport</p>
          <p className="text-[13px] text-muted-ink">Your borrower passport is linked to your wallet address.</p>
        </div>
      </AppShell>
    );
  }

  if (!connected) {
    return (
      <AppShell title="Borrower Passport">
        <div className="p-6 max-w-lg mx-auto mt-12">
          <div className="panel p-6 space-y-5">
            <div>
              <h2 className="font-heading font-bold text-[20px] text-ink mb-1">Create your Borrower Passport</h2>
              <p className="text-[13px] text-muted-ink">
                Your passport stores your credit profile hash, tier history, and reputation summary on GenLayer.
              </p>
            </div>
            <div className="p-3 border border-[rgba(17,17,17,0.1)] bg-[rgba(17,17,17,0.03)] text-[12px] font-financial">
              {shortAddress(address)}
            </div>
            <div>
              <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-2">
                Borrower Alias
              </label>
              <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="e.g. adaeze.eth"
                className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[14px] font-body outline-none focus:border-ink"
              />
            </div>
            <div className="text-[11px] text-muted-ink space-y-1">
              <div className="flex items-center gap-2"><Lock size={11} /> Raw identity documents are never stored on-chain.</div>
              <div className="flex items-center gap-2"><Lock size={11} /> Only your profile hash and GenLayer credit decisions are stored.</div>
            </div>
            {txStatus && <p className="text-[12px] text-[#2457FF] font-financial">{txStatus}</p>}
            {error && <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>}
            <Button onClick={handleCreate} disabled={creating || !alias.trim()} className="w-full justify-center">
              {creating ? txStatus ?? "Processing…" : "Create Passport"}
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const borrower = connected;

  return (
    <AppShell title="Borrower Passport">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <motion.div className="passport-card p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[rgba(17,17,17,0.08)] flex items-center justify-center">
                <User size={16} className="text-ink" />
              </div>
              <div>
                <p className="font-heading font-bold text-[20px] text-ink">{borrower.alias}</p>
                <p className="text-[11px] font-financial text-muted-ink">{shortAddress(borrower.wallet)}</p>
              </div>
            </div>
            <CreditTierBadge tier={borrower.currentTier} />
          </div>
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[rgba(17,17,17,0.1)]">
            {[
              { label: "Reviews", value: borrower.reviewCount.toString() },
              { label: "Repayments", value: borrower.successfulRepayments.toString() },
              { label: "Defaults", value: borrower.defaults.toString() },
              { label: "Appeals", value: myAppeals.length.toString() },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">{s.label}</p>
                <p className="font-heading font-bold text-[22px] text-ink">{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="panel p-4">
          <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink mb-2">Profile Hash</p>
          <p className="font-mono text-[11px] text-muted-ink break-all">{borrower.profileHash}</p>
        </div>

        <div className="border border-[rgba(214,168,79,0.3)] bg-[rgba(214,168,79,0.04)] p-4 flex items-start gap-3">
          <Shield size={15} className="text-[#D6A84F] shrink-0 mt-0.5" />
          <div className="text-[12px] text-muted-ink space-y-1">
            <p className="font-medium text-ink">Credence does not publish private documents.</p>
            <p>The protocol stores hashes, summaries, and GenLayer-backed credit decisions. You can appeal incomplete or stale reviews.</p>
          </div>
        </div>

        <div className="panel">
          <div className="px-4 py-3 border-b border-[rgba(17,17,17,0.1)]">
            <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Credit Review History</p>
          </div>
          {myReviews.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[13px] text-muted-ink">No credit reviews yet. Submit a reputation packet to get started.</p>
            </div>
          ) : (
            <table className="w-full ledger-table">
              <thead>
                <tr><th>Review</th><th>Status</th><th>Tier</th><th>Collateral</th></tr>
              </thead>
              <tbody>
                {myReviews.map((r) => (
                  <tr key={r.id}>
                    <td className="font-financial text-[11px]">{r.id}</td>
                    <td>
                      <Badge variant={r.status === "REVIEWED" ? "green" : r.status === "UNDER_REVIEW" ? "amber" : "grey"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td>{r.verdict ? <CreditTierBadge tier={r.verdict.creditTier} /> : <span className="text-muted-ink text-[12px]">—</span>}</td>
                    <td className="font-financial text-[12px]">{r.verdict ? `${r.verdict.recommendedCollateralRatio}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel p-4">
          <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink mb-3">Upgrade Path</p>
          <div className="flex items-center gap-2">
            {["TIER_0_UNREVIEWED","TIER_1_TRIAL","TIER_2_LIMITED","TIER_3_TRUSTED","TIER_4_HIGH_TRUST","TIER_5_INSTITUTIONAL"].map((tier, i) => {
              const tiers = ["TIER_0_UNREVIEWED","TIER_1_TRIAL","TIER_2_LIMITED","TIER_3_TRUSTED","TIER_4_HIGH_TRUST","TIER_5_INSTITUTIONAL"];
              const currentIdx = tiers.indexOf(borrower.currentTier);
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={tier} className="flex items-center gap-2">
                  <div className={`w-5 h-5 flex items-center justify-center text-[9px] font-bold ${isCurrent ? "bg-[#D6A84F] text-[#15130F]" : isPast ? "bg-[#2E9D68] text-white" : "bg-[rgba(17,17,17,0.08)] text-muted-ink"}`}>
                    {isPast ? <CheckCircle size={10} /> : isCurrent ? <Clock size={10} /> : i}
                  </div>
                  {i < 5 && <div className={`h-0.5 w-6 ${isPast ? "bg-[#2E9D68]" : "bg-[rgba(17,17,17,0.1)]"}`} />}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-ink mt-3">Repay on time to qualify for tier upgrades. Each tier reduces the minimum collateral requirement.</p>
        </div>
      </div>
    </AppShell>
  );
}
