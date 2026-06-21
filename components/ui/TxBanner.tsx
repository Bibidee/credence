import { explorerTx } from "@/lib/utils/format";
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Props {
  status: "idle" | "pending" | "success" | "error";
  message?: string;
  txHash?: string;
  error?: string;
}

export default function TxBanner({ status, message, txHash, error }: Props) {
  if (status === "idle") return null;

  if (status === "pending") return (
    <div className="flex items-center gap-2 p-3 bg-[rgba(36,87,255,0.06)] border border-[rgba(36,87,255,0.2)] text-[12px] text-[#2457FF]">
      <Loader2 size={13} className="animate-spin shrink-0" />
      <span className="font-financial">{message ?? "Waiting for GenLayer consensus…"}</span>
    </div>
  );

  if (status === "success" && txHash) return (
    <div className="flex items-center gap-2 p-3 bg-[rgba(46,157,104,0.06)] border border-[rgba(46,157,104,0.2)] text-[12px] text-[#2E9D68]">
      <CheckCircle2 size={13} className="shrink-0" />
      <span className="font-financial flex-1">{message ?? "Transaction confirmed."}</span>
      <a href={explorerTx(txHash)} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 underline underline-offset-2 text-[#2E9D68] hover:opacity-70">
        {txHash.slice(0, 8)}… <ExternalLink size={10} />
      </a>
    </div>
  );

  if (status === "error") return (
    <div className="flex items-center gap-2 p-3 bg-[rgba(200,52,45,0.06)] border border-[rgba(200,52,45,0.2)] text-[12px] text-[#C8342D]">
      <XCircle size={13} className="shrink-0" />
      <span className="font-financial">{error ?? "Transaction failed."}</span>
    </div>
  );

  return null;
}
