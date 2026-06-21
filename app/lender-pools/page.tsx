"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { hashObject } from "@/lib/credence/evidenceHasher";
import { getClientReady } from "@/lib/genlayer/client";
import { getContractAddress } from "@/lib/genlayer/contract";
import { waitForTx } from "@/lib/genlayer/txWaiter";
import { Building2, Plus, X } from "lucide-react";
import type { LenderPool, RiskAppetite } from "@/lib/genlayer/types";
import { motion, AnimatePresence } from "framer-motion";

const RISK_APPETITES: RiskAppetite[] = ["CONSERVATIVE", "BALANCED", "GROWTH", "EXPERIMENTAL"];
const APPETITE_COLOR: Record<RiskAppetite, string> = {
  CONSERVATIVE: "grey", BALANCED: "blue", GROWTH: "gold", EXPERIMENTAL: "amber",
};

export default function LenderPoolsPage() {
  const { pools, addPool } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", asset: "USDC", maxLoanAmount: "1000", maxDurationDays: 60,
    riskAppetite: "BALANCED" as RiskAppetite, minimumTier: "TIER_1_TRIAL",
  });
  const [creating, setCreating] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!address || !form.name) return;
    setCreating(true);
    setError(null);
    setTxStatus("Preparing transaction…");
    try {
      const poolId = `pool_${Date.now()}`;
      const riskPolicyHash = await hashObject({ pool: form.name, asset: form.asset, time: Date.now() });

      const profileJson = JSON.stringify({
        owner: address,
        name: form.name,
        asset: form.asset,
        minimumTier: form.minimumTier,
        maxLoanAmount: `${form.maxLoanAmount} ${form.asset}`,
        maxDurationDays: form.maxDurationDays,
        riskAppetite: form.riskAppetite,
      });

      const client = await getClientReady();
      setTxStatus("Waiting for wallet signature…");

      const txHash = await (client as any).writeContract({
        address: getContractAddress(),
        functionName: "register_lender_pool",
        args: [poolId, profileJson, riskPolicyHash],
      });

      setTxStatus("Transaction submitted — waiting for GenLayer consensus…");
      await waitForTx(txHash as `0x${string}`);

      const pool: LenderPool = {
        id: poolId,
        owner: address,
        name: form.name,
        asset: form.asset,
        riskPolicyHash,
        minimumTier: form.minimumTier as any,
        maxLoanAmount: `${form.maxLoanAmount} ${form.asset}`,
        maxDurationDays: form.maxDurationDays,
        riskAppetite: form.riskAppetite,
        createdAt: new Date().toISOString(),
      };

      addPool(pool);
      setTxStatus(null);
      setShowForm(false);
      setForm({ name: "", asset: "USDC", maxLoanAmount: "1000", maxDurationDays: 60, riskAppetite: "BALANCED", minimumTier: "TIER_1_TRIAL" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title="Lender Pools">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{pools.length} pools registered</p>
          <Button onClick={() => { setShowForm(true); setError(null); setTxStatus(null); }} size="sm">
            <Plus size={13} /> New Pool
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              className="panel p-5 space-y-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[15px]">New Lender Pool</h3>
                <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Pool Name", key: "name", type: "text", placeholder: "e.g. Grassroots Capital" },
                  { label: "Asset", key: "asset", type: "text", placeholder: "USDC" },
                  { label: "Max Loan Amount", key: "maxLoanAmount", type: "number", placeholder: "1000" },
                  { label: "Max Duration (days)", key: "maxDurationDays", type: "number", placeholder: "60" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Risk Appetite</label>
                  <select
                    value={form.riskAppetite}
                    onChange={(e) => setForm((f) => ({ ...f, riskAppetite: e.target.value as RiskAppetite }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink"
                  >
                    {RISK_APPETITES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Minimum Tier</label>
                  <select
                    value={form.minimumTier}
                    onChange={(e) => setForm((f) => ({ ...f, minimumTier: e.target.value }))}
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink"
                  >
                    {["TIER_1_TRIAL","TIER_2_LIMITED","TIER_3_TRUSTED","TIER_4_HIGH_TRUST"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {txStatus && (
                <p className="text-[12px] text-[#2457FF] font-financial">{txStatus}</p>
              )}
              {error && (
                <p className="text-[12px] text-[#C8342D] font-financial">{error}</p>
              )}

              <Button onClick={handleCreate} disabled={creating || !form.name || !address} size="sm">
                {creating ? txStatus ?? "Processing…" : "Create Pool"}
              </Button>
              {!address && (
                <p className="text-[11px] text-muted-ink">Connect your wallet first.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {pools.length === 0 && !showForm && (
            <div className="panel p-10 text-center text-muted-ink text-[13px]">
              No pools registered yet. Create the first one.
            </div>
          )}
          {pools.map((pool) => (
            <div key={pool.id} className="panel p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-[#D6A84F]" />
                  <div>
                    <p className="font-heading font-bold text-[16px] text-ink">{pool.name}</p>
                    <p className="text-[11px] font-financial text-muted-ink">{pool.id}</p>
                  </div>
                </div>
                <Badge variant={APPETITE_COLOR[pool.riskAppetite] as any}>{pool.riskAppetite}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-3 border-t border-[rgba(17,17,17,0.08)]">
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Asset</p>
                  <p className="font-bold text-[13px]">{pool.asset}</p>
                </div>
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Max Loan</p>
                  <p className="font-bold text-[13px]">{pool.maxLoanAmount}</p>
                </div>
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Max Duration</p>
                  <p className="font-bold text-[13px]">{pool.maxDurationDays}d</p>
                </div>
                <div>
                  <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink">Min Tier</p>
                  <p className="font-bold text-[13px] text-[#2457FF]">{pool.minimumTier.replace("TIER_","T").replace("_"," ")}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[rgba(17,17,17,0.08)]">
                <p className="text-[9px] font-financial uppercase tracking-widest text-muted-ink mb-1">Risk Policy Hash</p>
                <p className="text-[11px] font-mono text-muted-ink break-all">{pool.riskPolicyHash}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
