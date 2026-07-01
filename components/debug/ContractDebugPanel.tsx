"use client";

import { useState } from "react";
import { runContractDiagnostic } from "@/lib/genlayer/debug";

export default function ContractDebugPanel() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof runContractDiagnostic>> | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    const r = await runContractDiagnostic();
    setResult(r);
    setRunning(false);
    console.group("[Credence] Contract Diagnostic");
    console.log("Contract address:", r.contractAddress);
    console.log("Chain ID:", r.chainId);
    console.log("Ping result:", r.pingResult);
    console.log("Ping raw:", r.pingRaw);
    console.log("Stats result:", r.statsResult);
    console.log("Stats raw:", r.statsRaw);
    if (r.error) console.error("Error:", r.error);
    console.groupEnd();
  }

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-financial uppercase tracking-widest text-muted-ink">Contract Diagnostic</p>
        <button
          onClick={run}
          disabled={running}
          className="px-3 py-1 bg-ink text-canvas text-[11px] hover:bg-ledger-black disabled:opacity-50"
        >
          {running ? "Running…" : "Run Diagnostic"}
        </button>
      </div>

      <div className="space-y-1 text-[11px] font-financial">
        <div className="flex gap-3">
          <span className="text-muted-ink w-32 shrink-0">Contract Address</span>
          <span className="text-ink break-all">{process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "NOT SET"}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-ink w-32 shrink-0">RPC URL</span>
          <span className="text-ink break-all">{process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "NOT SET"}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-ink w-32 shrink-0">Chain ID (env)</span>
          <span className="text-ink">{process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "NOT SET"}</span>
        </div>
      </div>

      {result && (
        <div className="border border-[rgba(17,17,17,0.12)] p-4 space-y-3 text-[11px] font-financial">
          <div className="flex gap-3">
            <span className="text-muted-ink w-32 shrink-0">Chain ID (wallet)</span>
            <span className="text-ink">{result.chainId ?? "n/a"}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-ink w-32 shrink-0">get_pool_count</span>
            <span className={
              result.pingResult === "ok" ? "text-[#2E9D68]" :
              result.pingResult === "empty" ? "text-[#F2A93B]" : "text-[#C8342D]"
            }>
              {result.pingResult === "error"
                ? "ERROR"
                : result.pingResult === "empty"
                ? "0 (contract empty — no pools yet)"
                : `${result.pingRaw} pool(s)`}
            </span>
          </div>

          {result.error && (
            <div className="space-y-1">
              <span className="text-[#C8342D]">RPC Error:</span>
              <pre className="whitespace-pre-wrap break-all text-[10px] text-[#C8342D] bg-[rgba(200,52,45,0.05)] p-2">
                {result.error}
              </pre>
            </div>
          )}

          {result.statsResult && (
            <div className="space-y-1">
              <span className="text-muted-ink">get_dashboard_stats:</span>
              <div className="grid grid-cols-3 gap-x-6 gap-y-1 mt-1">
                {Object.entries(result.statsResult).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-muted-ink">{k}</span>
                    <span className="text-ink">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
