import type { ReputationPacket, CreditTier, IdentityAttestation, OffchainAttestation, OnchainHistory, LoanPurpose } from "@/lib/genlayer/types";
import { hashObject } from "./evidenceHasher";

export interface ReputationPacketDraft {
  reviewId: string;
  borrowerId: string;
  poolId: string;
  walletAddress: string;
  requestedTier: CreditTier;
  requestedAmount: string;
  requestedDurationDays: number;
  identityAttestations: IdentityAttestation[];
  onchainHistory: OnchainHistory;
  offchainAttestations: OffchainAttestation[];
  loanPurpose: LoanPurpose;
}

export async function buildReputationPacket(draft: ReputationPacketDraft): Promise<{
  packet: ReputationPacket;
  packetHash: string;
  evidenceHash: string;
}> {
  const packet: ReputationPacket = {
    ...draft,
    privacyStatement:
      "Raw private documents are not submitted on-chain. Only hashes, summaries, and attestation references are included.",
    submittedAt: new Date().toISOString(),
  };

  const evidenceItems = [
    ...packet.identityAttestations.map((a) => a.attestationHash),
    ...packet.offchainAttestations.map((a) => a.documentHash),
  ];

  const evidenceHash = await hashObject(evidenceItems);
  const packetHash = await hashObject(packet);

  return { packet, packetHash, evidenceHash };
}
