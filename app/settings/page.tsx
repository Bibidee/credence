"use client";

import AppShell from "@/components/layout/AppShell";
import { useWallet } from "@/lib/context/WalletContext";
import { useCredence } from "@/lib/context/CredenceContext";
import { shortAddress } from "@/lib/utils/format";
import { Settings, Wallet, Shield, Bell, AlertTriangle, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import ContractDebugPanel from "@/components/debug/ContractDebugPanel";

export default function SettingsPage() {
  const { address, connect, disconnect, switchNetwork, isConnecting } = useWallet();
  const { clearLocalCache } = useCredence();

  return (
    <AppShell title="Settings">
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        {/* Wallet */}
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={15} className="text-[#D6A84F]" />
            <h3 className="font-heading font-bold text-[15px]">Wallet Connection</h3>
          </div>
          {address ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink">Connected Address</p>
                  <p className="font-mono text-[13px] text-ink mt-0.5">{address}</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2E9D68]" />
                  <span className="text-[11px] text-[#2E9D68]">Connected</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={switchNetwork}>Switch to Studionet</Button>
                <Button variant="ghost" size="sm" onClick={disconnect}>Disconnect</Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-muted-ink mb-3">No wallet connected. Connect an injected EVM wallet (MetaMask, Rabby, etc.) to use Credence.</p>
              <Button onClick={connect} disabled={isConnecting}>
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            </div>
          )}
        </div>

        {/* Network */}
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-[#2457FF]" />
            <h3 className="font-heading font-bold text-[15px]">Network Settings</h3>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between items-center py-2 border-b border-[rgba(17,17,17,0.06)]">
              <span className="text-muted-ink">Network</span>
              <span className="font-financial">GenLayer Studionet</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(17,17,17,0.06)]">
              <span className="text-muted-ink">Chain ID</span>
              <span className="font-financial">61999</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(17,17,17,0.06)]">
              <span className="text-muted-ink">RPC URL</span>
              <span className="font-financial text-[11px]">{process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-ink">Contract Address</span>
              <span className="font-financial text-[11px]">{process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "Not deployed"}</span>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-[#D6A84F]" />
            <h3 className="font-heading font-bold text-[15px]">Privacy Settings</h3>
          </div>
          <div className="space-y-3 text-[13px] text-muted-ink">
            <p>Credence never stores raw identity documents, bank statements, government IDs, or biometric data on-chain.</p>
            <p>Only profile hashes, attestation hashes, evidence summaries, and GenLayer-backed credit decisions are stored.</p>
            <p>You can appeal incomplete or stale reviews at any time from the Appeals page.</p>
          </div>
        </div>

        {/* Contract Diagnostic */}
        <ContractDebugPanel />

        {/* Cache */}
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 size={15} className="text-[#F2A93B]" />
            <h3 className="font-heading font-bold text-[15px]">Local Cache</h3>
          </div>
          <p className="text-[13px] text-muted-ink mb-3">
            The app caches recently-seen IDs in localStorage, scoped to the current contract address and chain.
            After redeploying the contract, clear this cache so stale IDs from the old contract are removed.
            The dashboard will repopulate from the new contract automatically.
          </p>
          <Button variant="secondary" size="sm" onClick={() => { clearLocalCache(); window.location.reload(); }}>
            Clear cache for this contract
          </Button>
        </div>

        {/* Danger zone */}
        <div className="panel p-5 border-[rgba(200,52,45,0.2)]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-[#C8342D]" />
            <h3 className="font-heading font-bold text-[15px]">High-Risk Credit Handling</h3>
          </div>
          <p className="text-[13px] text-muted-ink mb-3">
            For suspected fraud, identity theft, forged attestations, or illegal loan-purpose categories, Credence
            does not continue automatic review. These cases are routed to human review.
          </p>
          <div className="p-3 bg-[rgba(200,52,45,0.06)] border border-[rgba(200,52,45,0.15)] text-[12px] text-[#C8342D]">
            High-risk credit evidence withheld. Human/fraud review required.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
