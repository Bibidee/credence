"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  Borrower, LenderPool, RiskPolicy, CreditReview, Loan, DefaultReview, CreditAppeal,
} from "@/lib/genlayer/types";

interface ProtocolStats {
  totalReviews: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalLoans: number;
  totalRepaid: number;
  totalDefaults: number;
  totalAppeals: number;
  appealReversals: number;
  avgCollateralRatio: number;
  avgConfidence: number;
  totalBorrowers: number;
  totalPools: number;
}

const EMPTY_STATS: ProtocolStats = {
  totalReviews: 0,
  approvedCount: 0,
  rejectedCount: 0,
  pendingCount: 0,
  totalLoans: 0,
  totalRepaid: 0,
  totalDefaults: 0,
  totalAppeals: 0,
  appealReversals: 0,
  avgCollateralRatio: 0,
  avgConfidence: 0,
  totalBorrowers: 0,
  totalPools: 0,
};

interface CredenceState {
  borrowers: Borrower[];
  pools: LenderPool[];
  policies: RiskPolicy[];
  reviews: CreditReview[];
  loans: Loan[];
  defaults: DefaultReview[];
  appeals: CreditAppeal[];
  stats: ProtocolStats;
  addBorrower: (b: Borrower) => void;
  addPool: (p: LenderPool) => void;
  addPolicy: (p: RiskPolicy) => void;
  addReview: (r: CreditReview) => void;
  updateReview: (id: string, updates: Partial<CreditReview>) => void;
  addLoan: (l: Loan) => void;
  addDefault: (d: DefaultReview) => void;
  updateDefault: (id: string, updates: Partial<DefaultReview>) => void;
  addAppeal: (a: CreditAppeal) => void;
  updateAppeal: (id: string, updates: Partial<CreditAppeal>) => void;
  setStats: (s: ProtocolStats) => void;
}

const CredenceContext = createContext<CredenceState>({} as CredenceState);

export function CredenceProvider({ children }: { children: React.ReactNode }) {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [pools, setPools] = useState<LenderPool[]>([]);
  const [policies, setPolicies] = useState<RiskPolicy[]>([]);
  const [reviews, setReviews] = useState<CreditReview[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [defaults, setDefaults] = useState<DefaultReview[]>([]);
  const [appeals, setAppeals] = useState<CreditAppeal[]>([]);
  const [stats, setStats] = useState<ProtocolStats>(EMPTY_STATS);

  const addBorrower = useCallback((b: Borrower) => setBorrowers((prev) => [b, ...prev]), []);
  const addPool = useCallback((p: LenderPool) => setPools((prev) => [p, ...prev]), []);
  const addPolicy = useCallback((p: RiskPolicy) => setPolicies((prev) => [p, ...prev]), []);
  const addReview = useCallback((r: CreditReview) => setReviews((prev) => [r, ...prev]), []);
  const updateReview = useCallback((id: string, updates: Partial<CreditReview>) =>
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r)), []);
  const addLoan = useCallback((l: Loan) => setLoans((prev) => [l, ...prev]), []);
  const addDefault = useCallback((d: DefaultReview) => setDefaults((prev) => [d, ...prev]), []);
  const updateDefault = useCallback((id: string, updates: Partial<DefaultReview>) =>
    setDefaults((prev) => prev.map((d) => d.id === id ? { ...d, ...updates } : d)), []);
  const addAppeal = useCallback((a: CreditAppeal) => setAppeals((prev) => [a, ...prev]), []);
  const updateAppeal = useCallback((id: string, updates: Partial<CreditAppeal>) =>
    setAppeals((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a)), []);

  return (
    <CredenceContext.Provider value={{
      borrowers, pools, policies, reviews, loans, defaults, appeals, stats,
      addBorrower, addPool, addPolicy, addReview, updateReview,
      addLoan, addDefault, updateDefault, addAppeal, updateAppeal, setStats,
    }}>
      {children}
    </CredenceContext.Provider>
  );
}

export const useCredence = () => useContext(CredenceContext);
