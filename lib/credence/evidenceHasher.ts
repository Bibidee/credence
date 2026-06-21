export async function hashString(input: string): Promise<string> {
  if (typeof window === "undefined") return `hash_${btoa(input).slice(0, 16)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashObject(obj: unknown): Promise<string> {
  return hashString(JSON.stringify(obj));
}

export function shortHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export const EVIDENCE_TYPES = [
  "WALLET_HISTORY_SUMMARY",
  "PRIOR_REPAYMENT_RECORD",
  "INCOME_ATTESTATION_HASH",
  "DAO_CONTRIBUTION_ATTESTATION",
  "EMPLOYER_ATTESTATION_HASH",
  "BUSINESS_INVOICE_HASH",
  "PROOF_OF_PERSONHOOD_ATTESTATION",
  "KYC_PROVIDER_ATTESTATION",
  "GUARANTOR_ATTESTATION",
  "BANK_STATEMENT_SUMMARY_HASH",
  "LOAN_PURPOSE_SUMMARY",
] as const;

export type EvidenceType = typeof EVIDENCE_TYPES[number];
