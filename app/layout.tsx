import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/context/WalletContext";
import { CredenceProvider } from "@/lib/context/CredenceContext";

export const metadata: Metadata = {
  title: "Credence — Consensus-backed creditworthiness for under-collateralized lending",
  description:
    "Credence is a GenLayer-native credit arbitration layer for under-collateralized lending. AI-validator consensus reviews borrower reputation packets, identity attestations, repayment history, and lender risk policies to produce explainable credit decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-canvas text-ink" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>
        <WalletProvider>
          <CredenceProvider>
            {children}
          </CredenceProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
