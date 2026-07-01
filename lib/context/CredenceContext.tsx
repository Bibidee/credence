"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { LenderPool, BorrowerProfile, CreditReview, Loan, DefaultReview, Appeal } from "@/lib/genlayer/types";
import {
  apiGetPool, apiGetBorrower, apiGetReview, apiGetLoan, apiGetDefault, apiGetAppeal,
  apiGetPoolCount, apiGetPoolId,
  apiGetBorrowerCount, apiGetBorrowerId,
  apiGetReviewCount, apiGetReviewId,
  apiGetLoanCount, apiGetLoanId,
  apiGetDefaultCount, apiGetDefaultId,
  apiGetAppealCount, apiGetAppealId,
} from "@/lib/genlayer/contractApi";

// ── Cache helpers (scoped by chainId + contractAddress) ────────────────────

function cacheKey(scope: string, entity: string): string {
  return `credence:${scope}:${entity}`;
}

function loadCache(scope: string, entity: string): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(cacheKey(scope, entity)) || "[]"); } catch { return []; }
}

function saveCache(scope: string, entity: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(cacheKey(scope, entity), JSON.stringify(ids));
}

function clearCache(scope: string) {
  if (typeof window === "undefined") return;
  ["pool","borrower","review","loan","default","appeal"].forEach(e => {
    localStorage.removeItem(cacheKey(scope, e));
  });
}

function getCacheScope(): string {
  const chainId = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "61999";
  const addr = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "unknown";
  return `${chainId}:${addr}`;
}

// ── Fetch all IDs from contract, merge with cached extras ──────────────────

async function fetchIdsFromContract(
  countFn: () => Promise<number>,
  idFn: (i: number) => Promise<string>,
  scope: string,
  entity: string,
): Promise<string[]> {
  const count = await countFn();
  const contractIds: string[] = [];
  for (let i = 0; i < count; i++) {
    contractIds.push(await idFn(i));
  }
  // Merge with any locally-known IDs not yet finalized on-chain
  const cached = loadCache(scope, entity);
  const merged = Array.from(new Set([...contractIds, ...cached]));
  saveCache(scope, entity, merged);
  return merged;
}

// ── Context types ──────────────────────────────────────────────────────────

interface CredenceState {
  pools: LenderPool[];
  borrowers: BorrowerProfile[];
  reviews: CreditReview[];
  loans: Loan[];
  defaults: DefaultReview[];
  appeals: Appeal[];
  loading: boolean;
  error: string | null;
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
  clearLocalCache: () => void;
}

const Ctx = createContext<CredenceState>({
  pools: [], borrowers: [], reviews: [], loans: [], defaults: [], appeals: [],
  loading: false, error: null,
  refreshPool: async () => {}, refreshReview: async () => {}, refreshLoan: async () => {},
  refreshDefault: async () => {}, refreshAppeal: async () => {}, refreshAll: async () => {},
  registerPoolId: () => {}, registerBorrowerId: () => {}, registerReviewId: () => {},
  registerLoanId: () => {}, registerDefaultId: () => {}, registerAppealId: () => {},
  clearLocalCache: () => {},
});

export function CredenceProvider({ children }: { children: React.ReactNode }) {
  const [pools, setPools] = useState<LenderPool[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerProfile[]>([]);
  const [reviews, setReviews] = useState<CreditReview[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [defaults, setDefaults] = useState<DefaultReview[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scope = getCacheScope();

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pIds, bIds, rIds, lIds, dIds, aIds] = await Promise.all([
        fetchIdsFromContract(apiGetPoolCount, apiGetPoolId, scope, "pool"),
        fetchIdsFromContract(apiGetBorrowerCount, apiGetBorrowerId, scope, "borrower"),
        fetchIdsFromContract(apiGetReviewCount, apiGetReviewId, scope, "review"),
        fetchIdsFromContract(apiGetLoanCount, apiGetLoanId, scope, "loan"),
        fetchIdsFromContract(apiGetDefaultCount, apiGetDefaultId, scope, "default"),
        fetchIdsFromContract(apiGetAppealCount, apiGetAppealId, scope, "appeal"),
      ]);

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
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg);
      console.error("[CredenceContext] refreshAll failed:", msg);
    } finally {
      setLoading(false);
    }
  }, [scope]);

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

  const registerPoolId = useCallback((id: string) => {
    const ids = loadCache(scope, "pool");
    if (!ids.includes(id)) saveCache(scope, "pool", [...ids, id]);
  }, [scope]);

  const registerBorrowerId = useCallback((id: string) => {
    const ids = loadCache(scope, "borrower");
    if (!ids.includes(id)) saveCache(scope, "borrower", [...ids, id]);
  }, [scope]);

  const registerReviewId = useCallback((id: string) => {
    const ids = loadCache(scope, "review");
    if (!ids.includes(id)) saveCache(scope, "review", [...ids, id]);
  }, [scope]);

  const registerLoanId = useCallback((id: string) => {
    const ids = loadCache(scope, "loan");
    if (!ids.includes(id)) saveCache(scope, "loan", [...ids, id]);
  }, [scope]);

  const registerDefaultId = useCallback((id: string) => {
    const ids = loadCache(scope, "default");
    if (!ids.includes(id)) saveCache(scope, "default", [...ids, id]);
  }, [scope]);

  const registerAppealId = useCallback((id: string) => {
    const ids = loadCache(scope, "appeal");
    if (!ids.includes(id)) saveCache(scope, "appeal", [...ids, id]);
  }, [scope]);

  const clearLocalCache = useCallback(() => {
    clearCache(scope);
  }, [scope]);

  return (
    <Ctx.Provider value={{
      pools, borrowers, reviews, loans, defaults, appeals, loading, error,
      refreshPool, refreshReview, refreshLoan, refreshDefault, refreshAppeal, refreshAll,
      registerPoolId, registerBorrowerId, registerReviewId, registerLoanId, registerDefaultId, registerAppealId,
      clearLocalCache,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCredence = () => useContext(Ctx);
