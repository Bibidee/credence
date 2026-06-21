"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TxBanner from "@/components/ui/TxBanner";
import { useCredence } from "@/lib/context/CredenceContext";
import { useWallet } from "@/lib/context/WalletContext";
import { apiCreatePool } from "@/lib/genlayer/contractApi";
import { formatGEN, shortAddress } from "@/lib/utils/format";
import { Building2, Plus, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PoolsPage() {
  const router = useRouter();
  const { pools, registerPoolId, refreshPool } = useCredence();
  const { address } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [txState, setTxState] = useState<{ status: "idle"|"pending"|"success"|"error"; hash?: string; error?: string; msg?: string }>({ status: "idle" });

  async function handleCreate() {
    if (!address || !form.name.trim()) return;
    const poolId = `pool_${Date.now()}`;
    setTxState({ status: "pending", msg: "Waiting for wallet signature…" });
    try {
      const hash = await apiCreatePool(poolId, form.name.trim(), form.description.trim());
      registerPoolId(poolId);
      await refreshPool(poolId);
      setTxState({ status: "success", hash, msg: "Pool created on GenLayer." });
      setShowForm(false);
      setForm({ name: "", description: "" });
      setTimeout(() => router.push(`/pools/${poolId}`), 1200);
    } catch (e) {
      setTxState({ status: "error", error: e instanceof Error ? e.message : "Transaction failed" });
    }
  }

  return (
    <AppShell title="Lender Pools">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-ink">{pools.length} pools · native GEN liquidity</p>
          <Button onClick={() => { setShowForm(true); setTxState({ status: "idle" }); }} size="sm" disabled={!address}>
            <Plus size={13} /> New Pool
          </Button>
        </div>

        {!address && (
          <div className="panel p-4 text-[13px] text-muted-ink">Connect your wallet to create a lender pool.</div>
        )}

        <TxBanner status={txState.status} message={txState.msg} txHash={txState.hash} error={txState.error} />

        <AnimatePresence>
          {showForm && (
            <motion.div className="panel p-5 space-y-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[15px]">New Lender Pool</h3>
                <button onClick={() => setShowForm(false)}><X size={15} className="text-muted-ink" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Pool Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Grassroots Capital" className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="text-[10px] font-financial uppercase tracking-widest text-muted-ink block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Brief description of this pool's focus and goals."
                    className="w-full border border-[rgba(17,17,17,0.2)] bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink resize-none" />
                </div>
              </div>
              <p className="text-[11px] text-muted-ink">After creation, deposit native GEN on the pool detail page.</p>
              <Button onClick={handleCreate} disabled={txState.status === "pending" || !form.name.trim()} size="sm">
                {txState.status === "pending" ? "Creating…" : "Create Pool"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {pools.length === 0 && !showForm && (
            <div className="panel p-10 text-center">
              <Building2 size={32} className="text-[rgba(17,17,17,0.12)] mx-auto mb-3" />
              <p className="text-[13px] text-muted-ink">No pools yet. Create one to start lending native GEN.</p>
            </div>
          )}
          {pools.map(pool => (
            <Link key={pool.pool_id} href={`/pools/${pool.pool_id}`}
              className="panel p-5 flex items-start justify-between hover:bg-[rgba(17,17,17,0.02)] transition-colors block">
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-[#D6A84F] shrink-0 mt-0.5" />
                <div>
                  <p className="font-heading font-bold text-[15px] text-ink">{pool.pool_name}</p>
                  <p className="text-[11px] font-financial text-muted-ink">{pool.pool_id} · {shortAddress(pool.lender_address)}</p>
                  {pool.description && <p className="text-[12px] text-muted-ink mt-0.5">{pool.description}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={pool.status === "ACTIVE" ? "green" : pool.status === "PAUSED" ? "amber" : "grey"}>
                  {pool.status}
                </Badge>
                <div className="text-right">
                  <p className="text-[10px] font-financial text-muted-ink uppercase">Available</p>
                  <p className="font-bold text-[14px] text-ink">{formatGEN(pool.available_native_liquidity)}</p>
                </div>
                <p className="text-[11px] text-muted-ink">{pool.active_loan_count} active loan{pool.active_loan_count !== 1 ? "s" : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
