# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from datetime import datetime, timezone
from genlayer import *


def _now() -> int:
    return int(datetime.now(timezone.utc).timestamp())


class CredenceCredit(gl.Contract):
    pools: TreeMap[str, str]
    policies: TreeMap[str, str]
    borrowers: TreeMap[str, str]
    wallet_to_borrower: TreeMap[str, str]
    reviews: TreeMap[str, str]
    loans: TreeMap[str, str]
    defaults: TreeMap[str, str]
    appeals: TreeMap[str, str]

    def __init__(self) -> None:
        self.pools = TreeMap()
        self.policies = TreeMap()
        self.borrowers = TreeMap()
        self.wallet_to_borrower = TreeMap()
        self.reviews = TreeMap()
        self.loans = TreeMap()
        self.defaults = TreeMap()
        self.appeals = TreeMap()

    # ── Pool Management ────────────────────────────────────────────────────────

    @gl.public.write
    def create_pool(self, pool_id: str, name: str, description: str) -> None:
        if pool_id in self.pools:
            raise Exception("Pool already exists")
        pool = {
            "pool_id": pool_id,
            "lender_address": 
          str(gl.message.sender_address),
            "pool_name": name,
            "description": description,
            "policy_id": "",
            "pool_native_balance": 0,
            "available_native_liquidity": 0,
            "total_drawn_native": 0,
            "total_repaid_native": 0,
            "active_loan_count": 0,
            "status": "ACTIVE",
            "created_at": str(_now()),
            "updated_at": str(_now()),
        }
        self.pools[pool_id] = json.dumps(pool)

    @gl.public.write.payable
    def deposit_to_pool(self, pool_id: str, amount_wei: int) -> None:
        amount_wei = int(amount_wei)
        if pool_id not in self.pools:
            raise Exception("Pool not found")
        if amount_wei <= 0:
            raise Exception("Deposit amount must be greater than 0")
        pool = json.loads(self.pools[pool_id])
        if pool["status"] != "ACTIVE":
            raise Exception("Pool is not active")
        if str(gl.message.sender_address) != pool["lender_address"]:
            raise Exception("Only the pool lender can deposit")
        pool["pool_native_balance"] = pool.get("pool_native_balance", 0) + amount_wei
        pool["available_native_liquidity"] = pool.get("available_native_liquidity", 0) + amount_wei
        pool["updated_at"] = str(_now())
        self.pools[pool_id] = json.dumps(pool)

    @gl.public.write
    def create_policy(self, pool_id: str, policy_id: str, policy_json: str) -> None:
        if pool_id not in self.pools:
            raise Exception("Pool not found")
        pool = json.loads(self.pools[pool_id])
        if str(gl.message.sender_address) != pool["lender_address"]:
            raise Exception("Only the pool lender can create a policy")
        policy = json.loads(policy_json)
        policy["policy_id"] = policy_id
        policy["pool_id"] = pool_id
        policy["lender_address"] = str(gl.message.sender_address)
        policy["created_at"] = str(_now())
        self.policies[policy_id] = json.dumps(policy)
        pool["policy_id"] = policy_id
        pool["updated_at"] = str(_now())
        self.pools[pool_id] = json.dumps(pool)

    @gl.public.write
    def pause_pool(self, pool_id: str) -> None:
        if pool_id not in self.pools:
            raise Exception("Pool not found")
        pool = json.loads(self.pools[pool_id])
        if str(gl.message.sender_address) != pool["lender_address"]:
            raise Exception("Only the pool lender can pause it")
        pool["status"] = "PAUSED"
        pool["updated_at"] = str(_now())
        self.pools[pool_id] = json.dumps(pool)

    # ── Borrower Registration ──────────────────────────────────────────────────

    @gl.public.write
    def register_borrower(self, borrower_id: str, borrower_json: str) -> None:
        if borrower_id in self.borrowers:
            raise Exception("Borrower already registered")
        data = json.loads(borrower_json)
        borrower = {
            "borrower_id": borrower_id,
            "borrower_address": str(gl.message.sender_address),
            "borrower_name": data.get("borrower_name", ""),
            "borrower_type": data.get("borrower_type", "INDIVIDUAL"),
            "purpose_summary": data.get("purpose_summary", ""),
            "wallet_history_summary": data.get("wallet_history_summary", ""),
            "repayment_history_summary": data.get("repayment_history_summary", ""),
            "income_or_revenue_summary": data.get("income_or_revenue_summary", ""),
            "dao_or_work_history": data.get("dao_or_work_history", ""),
            "guarantor_note": data.get("guarantor_note", ""),
            "evidence_urls": data.get("evidence_urls", []),
            "repayment_count": 0,
            "default_count": 0,
            "status": "ACTIVE",
            "created_at": str(_now()),
            "updated_at": str(_now()),
        }
        self.borrowers[borrower_id] = json.dumps(borrower)
        self.wallet_to_borrower[str(gl.message.sender_address)] = borrower_id

    # ── Credit Review ──────────────────────────────────────────────────────────

    @gl.public.write
    def submit_reputation_packet(
        self,
        review_id: str,
        borrower_id: str,
        pool_id: str,
        requested_amount_wei: int,
        packet_json: str,
    ) -> None:
        requested_amount_wei = int(requested_amount_wei)
        if review_id in self.reviews:
            raise Exception("Review already exists")
        if borrower_id not in self.borrowers:
            raise Exception("Borrower not found")
        if pool_id not in self.pools:
            raise Exception("Pool not found")
        pool = json.loads(self.pools[pool_id])
        review = {
            "review_id": review_id,
            "borrower_id": borrower_id,
            "pool_id": pool_id,
            "policy_id": pool.get("policy_id", ""),
            "requested_amount_native": requested_amount_wei,
            "packet": json.loads(packet_json),
            "status": "PENDING",
            "verdict": None,
            "risk_band": None,
            "trust_score": None,
            "approved_amount_native": 0,
            "requires_more_evidence": False,
            "red_flags_summary": "",
            "missing_evidence_summary": "",
            "consensus_memo": "",
            "created_at": str(_now()),
            "evaluated_at": None,
        }
        self.reviews[review_id] = json.dumps(review)

    @gl.public.write
    def evaluate_credit_review(self, review_id: str) -> None:
        if review_id not in self.reviews:
            raise Exception("Review not found")
        review = json.loads(self.reviews[review_id])
        if review["status"] in ("APPROVED", "APPROVED_LIMITED", "REJECTED"):
            raise Exception("Review already finalized")

        pool_raw = self.pools.get(review["pool_id"])
        pool = json.loads(pool_raw) if pool_raw else {}
        policy_raw = self.policies.get(pool.get("policy_id", ""))
        policy = json.loads(policy_raw) if policy_raw else {}
        packet = review.get("packet", {})
        requested = review.get("requested_amount_native", 0)
        available = pool.get("available_native_liquidity", 0)

        prompt = f"""You are a credit arbitration system for native GEN lending. Evaluate this borrower against the lender policy.

POOL AVAILABLE (wei): {available}
REQUESTED (wei): {requested}
LENDER POLICY: {json.dumps(policy)}
BORROWER PACKET: {json.dumps(packet)}

Rules:
- Never discriminate on protected characteristics
- Base only on evidence quality, repayment history, wallet behavior, loan purpose, policy match
- approved_amount_native must not exceed min(available, requested)
- trust_score 0-100

Output ONLY valid compact JSON, no extra text:
{{"verdict":"APPROVE","risk_band":"LOW","trust_score":75,"approved_amount_native":{min(requested, available)},"requires_more_evidence":false,"red_flags_summary":"","missing_evidence_summary":"","consensus_memo":"Borrower demonstrates credible repayment capacity."}}

Allowed verdicts: APPROVE, APPROVE_LIMITED, REQUEST_MORE_EVIDENCE, REJECT, ESCALATE"""

        result = gl.exec_prompt(prompt)

        try:
            out = json.loads(result)
            verdict = out.get("verdict", "REJECT")
            if verdict not in ("APPROVE", "APPROVE_LIMITED", "REQUEST_MORE_EVIDENCE", "REJECT", "ESCALATE"):
                verdict = "REJECT"
            trust_score = max(0, min(100, int(out.get("trust_score", 0))))
            approved = int(out.get("approved_amount_native", 0))
            approved = min(approved, available, requested)
            approved = max(0, approved)
        except Exception:
            verdict = "REJECT"
            trust_score = 0
            approved = 0
            out = {}

        status_map = {
            "APPROVE": "APPROVED",
            "APPROVE_LIMITED": "APPROVED_LIMITED",
            "REQUEST_MORE_EVIDENCE": "MORE_EVIDENCE_REQUIRED",
            "ESCALATE": "ESCALATED",
            "REJECT": "REJECTED",
        }

        review["verdict"] = verdict
        review["status"] = status_map.get(verdict, "REJECTED")
        review["risk_band"] = str(out.get("risk_band", "HIGH"))[:20]
        review["trust_score"] = trust_score
        review["approved_amount_native"] = approved
        review["requires_more_evidence"] = bool(out.get("requires_more_evidence", False))
        review["red_flags_summary"] = str(out.get("red_flags_summary", ""))[:400]
        review["missing_evidence_summary"] = str(out.get("missing_evidence_summary", ""))[:400]
        review["consensus_memo"] = str(out.get("consensus_memo", ""))[:800]
        review["evaluated_at"] = str(_now())
        self.reviews[review_id] = json.dumps(review)

    # ── Loan Lifecycle ─────────────────────────────────────────────────────────

    @gl.public.write
    def create_loan(self, loan_id: str, review_id: str) -> None:
        if loan_id in self.loans:
            raise Exception("Loan already exists")
        if review_id not in self.reviews:
            raise Exception("Review not found")
        review = json.loads(self.reviews[review_id])
        if review["verdict"] not in ("APPROVE", "APPROVE_LIMITED"):
            raise Exception("Review not approved")

        pool_id = review["pool_id"]
        pool = json.loads(self.pools[pool_id])
        principal = review["approved_amount_native"]

        if pool["available_native_liquidity"] < principal:
            raise Exception("Insufficient pool liquidity")

        borrower = json.loads(self.borrowers[review["borrower_id"]])
        due_ts = _now() + 30 * 24 * 3600

        loan = {
            "loan_id": loan_id,
            "review_id": review_id,
            "borrower_id": review["borrower_id"],
            "pool_id": pool_id,
            "lender_address": pool["lender_address"],
            "borrower_address": borrower["borrower_address"],
            "principal_native": principal,
            "repay_due_native": principal,
            "drawn_amount_native": 0,
            "repaid_amount_native": 0,
            "outstanding_amount_native": principal,
            "due_timestamp": due_ts,
            "status": "APPROVED_NOT_DRAWN",
            "created_at": str(_now()),
            "drawn_at": None,
            "repaid_at": None,
        }

        pool["available_native_liquidity"] = pool["available_native_liquidity"] - principal
        pool["active_loan_count"] = pool.get("active_loan_count", 0) + 1
        pool["updated_at"] = str(_now())

        self.loans[loan_id] = json.dumps(loan)
        self.pools[pool_id] = json.dumps(pool)

    @gl.public.write
    def draw_loan(self, loan_id: str) -> None:
        if loan_id not in self.loans:
            raise Exception("Loan not found")
        loan = json.loads(self.loans[loan_id])
        if loan["status"] != "APPROVED_NOT_DRAWN":
            raise Exception("Loan not in drawable state")
        if str(gl.message.sender_address) != loan["borrower_address"]:
            raise Exception("Only the borrower can draw the loan")

        loan["status"] = "ACTIVE"
        loan["drawn_amount_native"] = loan["principal_native"]
        loan["drawn_at"] = str(_now())

        pool = json.loads(self.pools[loan["pool_id"]])
        pool["total_drawn_native"] = pool.get("total_drawn_native", 0) + loan["principal_native"]
        pool["updated_at"] = str(_now())

        self.loans[loan_id] = json.dumps(loan)
        self.pools[loan["pool_id"]] = json.dumps(pool)

    @gl.public.write.payable
    def repay_loan(self, loan_id: str, amount_wei: int) -> None:
        amount_wei = int(amount_wei)
        if loan_id not in self.loans:
            raise Exception("Loan not found")
        loan = json.loads(self.loans[loan_id])
        if loan["status"] not in ("ACTIVE", "PARTIALLY_REPAID", "OVERDUE"):
            raise Exception("Loan is not in a repayable state")
        if amount_wei <= 0:
            raise Exception("Repayment must be greater than 0")
        if str(gl.message.sender_address) != loan["borrower_address"]:
            raise Exception("Only the borrower can repay")

        outstanding = loan.get("outstanding_amount_native", loan["principal_native"])
        new_repaid = loan.get("repaid_amount_native", 0) + amount_wei
        new_outstanding = max(0, outstanding - amount_wei)

        loan["repaid_amount_native"] = new_repaid
        loan["outstanding_amount_native"] = new_outstanding

        if new_outstanding == 0:
            loan["status"] = "REPAID"
            loan["repaid_at"] = str(_now())
        else:
            loan["status"] = "PARTIALLY_REPAID"

        pool = json.loads(self.pools[loan["pool_id"]])
        pool["available_native_liquidity"] = pool.get("available_native_liquidity", 0) + amount_wei
        pool["total_repaid_native"] = pool.get("total_repaid_native", 0) + amount_wei
        if loan["status"] == "REPAID":
            pool["active_loan_count"] = max(0, pool.get("active_loan_count", 0) - 1)
        pool["updated_at"] = str(_now())

        self.loans[loan_id] = json.dumps(loan)
        self.pools[loan["pool_id"]] = json.dumps(pool)

        if loan["status"] == "REPAID":
            borrower_id = loan["borrower_id"]
            if borrower_id in self.borrowers:
                borrower = json.loads(self.borrowers[borrower_id])
                borrower["repayment_count"] = borrower.get("repayment_count", 0) + 1
                borrower["updated_at"] = str(_now())
                self.borrowers[borrower_id] = json.dumps(borrower)

    # ── Default Review ─────────────────────────────────────────────────────────

    @gl.public.write
    def open_default_review(
        self, default_id: str, loan_id: str, reason: str, borrower_response: str
    ) -> None:
        if default_id in self.defaults:
            raise Exception("Default review already exists")
        if loan_id not in self.loans:
            raise Exception("Loan not found")
        loan = json.loads(self.loans[loan_id])
        record = {
            "default_review_id": default_id,
            "loan_id": loan_id,
            "opened_by": str(gl.message.sender_address),
            "reason": reason[:500],
            "borrower_response": borrower_response[:500],
            "evidence_urls": [],
            "verdict": None,
            "memo": "",
            "status": "PENDING",
            "created_at": str(_now()),
            "evaluated_at": None,
        }
        self.defaults[default_id] = json.dumps(record)
        loan["status"] = "DEFAULT_REVIEW"
        self.loans[loan_id] = json.dumps(loan)

    @gl.public.write
    def evaluate_default(self, default_id: str) -> None:
        if default_id not in self.defaults:
            raise Exception("Default review not found")
        review = json.loads(self.defaults[default_id])
        if review["status"] == "REVIEWED":
            raise Exception("Default already evaluated")
        loan_raw = self.loans.get(review["loan_id"])
        loan = json.loads(loan_raw) if loan_raw else {}

        prompt = f"""Evaluate this loan default. The lender opened a default review and the borrower may have responded. Output ONLY valid compact JSON.

LOAN DETAILS: {json.dumps(loan)}
DEFAULT REASON: {review['reason']}
BORROWER RESPONSE: {review['borrower_response']}

Allowed verdicts: DEFAULT_CONFIRMED, DEFAULT_DISPUTED, DEFAULT_CURED, ESCALATE

Output ONLY valid compact JSON:
{{"verdict":"DEFAULT_CONFIRMED","severity":"MEDIUM","borrower_fault_level":"HIGH","can_be_cured":false,"memo":"Brief explanation."}}"""

        result = gl.exec_prompt(prompt)
        try:
            out = json.loads(result)
            verdict = out.get("verdict", "DEFAULT_CONFIRMED")
            if verdict not in ("DEFAULT_CONFIRMED", "DEFAULT_DISPUTED", "DEFAULT_CURED", "ESCALATE"):
                verdict = "DEFAULT_CONFIRMED"
        except Exception:
            out = {}
            verdict = "DEFAULT_CONFIRMED"

        review["verdict"] = verdict
        review["memo"] = str(out.get("memo", ""))[:500]
        review["status"] = "REVIEWED"
        review["evaluated_at"] = str(_now())
        self.defaults[default_id] = json.dumps(review)

        if review["loan_id"] in self.loans:
            loan = json.loads(self.loans[review["loan_id"]])
            if verdict == "DEFAULT_CONFIRMED":
                loan["status"] = "DEFAULT_CONFIRMED"
            elif verdict == "DEFAULT_CURED":
                loan["status"] = "ACTIVE"
            self.loans[review["loan_id"]] = json.dumps(loan)

        if verdict == "DEFAULT_CONFIRMED":
            borrower_id = loan.get("borrower_id", "")
            if borrower_id and borrower_id in self.borrowers:
                borrower = json.loads(self.borrowers[borrower_id])
                borrower["default_count"] = borrower.get("default_count", 0) + 1
                borrower["updated_at"] = str(_now())
                self.borrowers[borrower_id] = json.dumps(borrower)

    # ── Appeal ─────────────────────────────────────────────────────────────────

    @gl.public.write
    def submit_appeal(
        self,
        appeal_id: str,
        target_type: str,
        target_id: str,
        borrower_id: str,
        new_evidence_summary: str,
        old_verdict: str,
    ) -> None:
        if appeal_id in self.appeals:
            raise Exception("Appeal already exists")
        appeal = {
            "appeal_id": appeal_id,
            "target_type": target_type,
            "target_id": target_id,
            "borrower_id": borrower_id,
            "submitted_by": str(gl.message.sender_address),
            "new_evidence_summary": new_evidence_summary[:800],
            "new_evidence_urls": [],
            "old_verdict": old_verdict,
            "new_verdict": None,
            "memo": "",
            "status": "PENDING",
            "created_at": str(_now()),
            "evaluated_at": None,
        }
        self.appeals[appeal_id] = json.dumps(appeal)

    @gl.public.write
    def evaluate_appeal(self, appeal_id: str) -> None:
        if appeal_id not in self.appeals:
            raise Exception("Appeal not found")
        appeal = json.loads(self.appeals[appeal_id])
        if appeal["status"] == "REVIEWED":
            raise Exception("Appeal already evaluated")

        if appeal["target_type"] == "review":
            original_raw = self.reviews.get(appeal["target_id"])
        else:
            original_raw = self.defaults.get(appeal["target_id"])
        original = json.loads(original_raw) if original_raw else {}

        prompt = f"""Evaluate this appeal. Compare new evidence against the original decision. Output ONLY valid compact JSON.

ORIGINAL DECISION: {json.dumps(original)}
OLD VERDICT: {appeal['old_verdict']}
NEW EVIDENCE: {appeal['new_evidence_summary']}

Allowed verdicts: APPEAL_UPHELD, APPEAL_REJECTED, REQUEST_MORE_EVIDENCE, ESCALATE

Output ONLY valid compact JSON:
{{"verdict":"APPEAL_REJECTED","changed_original_decision":false,"requires_more_evidence":false,"memo":"Brief explanation."}}"""

        result = gl.exec_prompt(prompt)
        try:
            out = json.loads(result)
            verdict = out.get("verdict", "APPEAL_REJECTED")
            if verdict not in ("APPEAL_UPHELD", "APPEAL_REJECTED", "REQUEST_MORE_EVIDENCE", "ESCALATE"):
                verdict = "APPEAL_REJECTED"
        except Exception:
            out = {}
            verdict = "APPEAL_REJECTED"

        appeal["new_verdict"] = verdict
        appeal["memo"] = str(out.get("memo", ""))[:500]
        appeal["status"] = "REVIEWED"
        appeal["evaluated_at"] = str(_now())
        self.appeals[appeal_id] = json.dumps(appeal)

        if verdict == "APPEAL_UPHELD" and appeal["target_type"] == "review":
            target_id = appeal["target_id"]
            if target_id in self.reviews:
                review = json.loads(self.reviews[target_id])
                review["status"] = "APPROVED"
                review["verdict"] = "APPROVE"
                review["consensus_memo"] = f"Appeal upheld: {str(out.get('memo',''))[:200]}"
                self.reviews[target_id] = json.dumps(review)

    # ── View Methods ───────────────────────────────────────────────────────────

    @gl.public.view
    def get_pool(self, pool_id: str) -> str:
        return self.pools.get(pool_id) or "{}"

    @gl.public.view
    def get_policy(self, policy_id: str) -> str:
        return self.policies.get(policy_id) or "{}"

    @gl.public.view
    def get_borrower(self, borrower_id: str) -> str:
        return self.borrowers.get(borrower_id) or "{}"

    @gl.public.view
    def get_borrower_by_wallet(self, wallet: str) -> str:
        bid = self.wallet_to_borrower.get(wallet)
        if not bid:
            return "{}"
        return self.borrowers.get(bid) or "{}"

    @gl.public.view
    def get_review(self, review_id: str) -> str:
        return self.reviews.get(review_id) or "{}"

    @gl.public.view
    def get_loan(self, loan_id: str) -> str:
        return self.loans.get(loan_id) or "{}"

    @gl.public.view
    def get_default_review(self, default_id: str) -> str:
        return self.defaults.get(default_id) or "{}"

    @gl.public.view
    def get_appeal(self, appeal_id: str) -> str:
        return self.appeals.get(appeal_id) or "{}"
