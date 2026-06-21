"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { LenderPool, BorrowerProfile, CreditReview, Loan, DefaultReview, Appeal } from "@/lib/genlayer/types";
import {
  apiGetPool, apiGetBorrower, apiGetReview, apiGetLoan, apiGetDefault, apiGetAppeal,
} from "@/lib/genlayer/contractApi";

const KEYS = {
  pools: "cred_pool_ids",
  borrowers: "cred_borrower_ids",
  reviews: "cred_review_ids",
  loans: "cred_loan_ids",
  defaults: "cred_default_ids",
  appeals: "cred_appeal_ids",
};

function loadIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function saveIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(ids));
}

function addId(key: string, id: string) {
  const ids = loadIds(key);
  if (!ids.includes(id)) { ids.push(id); saveIds(key, ids); }
}

interface CredenceState {
  pools: LenderPool[];
  borrowers: BorrowerProfile[];
  reviews: CreditReview[];
  loans: Loan[];
  defaults: DefaultReview[];
  appeals: Appeal[];
  loading: boolean;
  refreshPool: (id: string) => Promise<void>;
  refreshReview: (id: string) => Promise<void>;
  refreshLoan: (id: string) => Promise<void>;
  refreshDefault: (id: string) => Promise<void>;
  refreshAppeal: (id: string) => Promise<void>;
  registerPoolId: (id: string) => void;
  registerBorrowerId: (id: string) => void;
  registerReviewId: (id: string) => void;
  registerLoanId: (id: string) => void;
  registerDefaultId: (id: string) => void;
  registerAppealId: (id: string) => void;
  refreshAll: () => Promise<void>;
}

const Ctx = createContext<CredenceState>({
  pools: [], borrowers: [], reviews: [], loans: [], defaults: [], appeals: [],
  loading: false,
  refreshPool: async () => {}, refreshReview: async () => {}, refreshLoan: async () => {},
  refreshDefault: async () => {}, refreshAppeal: async () => {}, refreshAll: async () => {},
  registerPoolId: () => {}, registerBorrowerId: () => {}, registerReviewId: () => {},
  registerLoanId: () => {}, registerDefaultId: () => {}, registerAppealId: () => {},
});

export function CredenceProvider({ children }: { children: React.ReactNode }) {
  const [pools, setPools] = useState<LenderPool[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerProfile[]>([]);
  const [reviews, setReviews] = useState<CreditReview[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [defaults, setDefaults] = useState<DefaultReview[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const pIds = loadIds(KEYS.pools);
      const bIds = loadIds(KEYS.borrowers);
      const rIds = loadIds(KEYS.reviews);
      const lIds = loadIds(KEYS.loans);
      const dIds = loadIds(KEYS.defaults);
      const aIds = loadIds(KEYS.appeals);
      const [ps, bs, rs, ls, ds, as_] = await Promise.all([
        Promise.all(pIds.map(id => apiGetPool(id))),
        Promise.all(bIds.map(id => apiGetBorrower(id))),
        Promise.all(rIds.map(id => apiGetReview(id))),
        Promise.all(lIds.map(id => apiGetLoan(id))),
        Promise.all(dIds.map(id => apiGetDefault(id))),
        Promise.all(aIds.map(id => apiGetAppeal(id))),
      ]);
      setPools(ps.filter(Boolean) as LenderPool[]);
      setBorrowers(bs.filter(Boolean) as BorrowerProfile[]);
      setReviews(rs.filter(Boolean) as CreditReview[]);
      setLoans(ls.filter(Boolean) as Loan[]);
      setDefaults(ds.filter(Boolean) as DefaultReview[]);
      setAppeals(as_.filter(Boolean) as Appeal[]);
    } catch (e) {
      console.error("refreshAll:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshPool = useCallback(async (id: string) => {
    const p = await apiGetPool(id);
    if (p) setPools(prev => prev.some(x => x.pool_id === id) ? prev.map(x => x.pool_id === id ? p : x) : [...prev, p]);
  }, []);

  const refreshReview = useCallback(async (id: string) => {
    const r = await apiGetReview(id);
    if (r) setReviews(prev => prev.some(x => x.review_id === id) ? prev.map(x => x.review_id === id ? r : x) : [...prev, r]);
  }, []);

  const refreshLoan = useCallback(async (id: string) => {
    const l = await apiGetLoan(id);
    if (l) setLoans(prev => prev.some(x => x.loan_id === id) ? prev.map(x => x.loan_id === id ? l : x) : [...prev, l]);
  }, []);

  const refreshDefault = useCallback(async (id: string) => {
    const d = await apiGetDefault(id);
    if (d) setDefaults(prev => prev.some(x => x.default_review_id === id) ? prev.map(x => x.default_review_id === id ? d : x) : [...prev, d]);
  }, []);

  const refreshAppeal = useCallback(async (id: string) => {
    const a = await apiGetAppeal(id);
    if (a) setAppeals(prev => prev.some(x => x.appeal_id === id) ? prev.map(x => x.appeal_id === id ? a : x) : [...prev, a]);
  }, []);

  const registerPoolId = useCallback((id: string) => { addId(KEYS.pools, id); }, []);
  const registerBorrowerId = useCallback((id: string) => { addId(KEYS.borrowers, id); }, []);
  const registerReviewId = useCallback((id: string) => { addId(KEYS.reviews, id); }, []);
  const registerLoanId = useCallback((id: string) => { addId(KEYS.loans, id); }, []);
  const registerDefaultId = useCallback((id: string) => { addId(KEYS.defaults, id); }, []);
  const registerAppealId = useCallback((id: string) => { addId(KEYS.appeals, id); }, []);

  return (
    <Ctx.Provider value={{
      pools, borrowers, reviews, loans, defaults, appeals, loading,
      refreshPool, refreshReview, refreshLoan, refreshDefault, refreshAppeal, refreshAll,
      registerPoolId, registerBorrowerId, registerReviewId, registerLoanId, registerDefaultId, registerAppealId,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCredence = () => useContext(Ctx);
