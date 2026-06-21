"use client";

import { useWallet } from "@/lib/context/WalletContext";
import { shortAddress } from "@/lib/utils/format";
import { Wallet, ChevronDown } from "lucide-react";

export default function Topbar({ title }: { title?: string }) {
  const { address, isConnecting, connect, disconnect } = useWallet();

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-[rgba(17,17,17,0.12)] bg-[#F4EFE6] sticky top-0 z-10">
      {title && (
        <h1 className="font-heading font-bold text-[13px] tracking-wide uppercase text-[rgba(17,17,17,0.56)]">
          {title}
        </h1>
      )}
      {!title && <div />}

      <div className="flex items-center gap-3">
        {address ? (
          <button
            onClick={disconnect}
            className="flex items-center gap-2 px-3 py-1.5 border border-[rgba(17,17,17,0.2)] text-[12px] font-financial hover:border-ink transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#2E9D68]" />
            {shortAddress(address)}
            <ChevronDown size={11} className="text-[rgba(17,17,17,0.4)]" />
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="flex items-center gap-2 px-3 py-1.5 bg-ink text-canvas text-[12px] font-financial hover:bg-ledger-black transition-colors disabled:opacity-50"
          >
            <Wallet size={12} />
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
