"use client";

import { getClient } from "./client";
import { getContractAddress } from "./contract";

export async function runContractDiagnostic(): Promise<{
  contractAddress: string;
  chainId: number | null;
  pingResult: "ok" | "empty" | "error";
  pingRaw: unknown;
  statsResult: Record<string, unknown> | null;
  statsRaw: unknown;
  error: string | null;
}> {
  const contractAddress = getContractAddress();
  let chainId: number | null = null;
  let pingRaw: unknown = null;
  let statsRaw: unknown = null;
  let pingResult: "ok" | "empty" | "error" = "error";
  let statsResult: Record<string, unknown> | null = null;
  let error: string | null = null;

  try {
    if (typeof window !== "undefined" && window.ethereum) {
      const raw = await window.ethereum.request({ method: "eth_chainId" });
      chainId = parseInt(raw as string, 16);
    }
  } catch {}

  try {
    const client = getClient();

    // Ping: call get_pool_count — simplest possible read
    pingRaw = await (client as any).readContract({
      address: contractAddress,
      functionName: "get_pool_count",
      args: [],
    });
    const count = typeof pingRaw === "string" ? JSON.parse(pingRaw) : pingRaw;
    pingResult = (count === 0 || count === "0") ? "empty" : "ok";

    // Stats: call get_dashboard_stats
    statsRaw = await (client as any).readContract({
      address: contractAddress,
      functionName: "get_dashboard_stats",
      args: [],
    });
    const statsStr = typeof statsRaw === "string" ? statsRaw : JSON.stringify(statsRaw);
    statsResult = JSON.parse(statsStr);
  } catch (e: any) {
    error = e?.message ?? String(e);
    pingResult = "error";
  }

  return { contractAddress, chainId, pingResult, pingRaw, statsResult, statsRaw, error };
}
