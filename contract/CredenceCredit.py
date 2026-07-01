# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
# CredenceCredit — GenLayer Intelligent Contract
# Native GEN-denominated lending pools with consensus-backed credit arbitration.

import json
from datetime import datetime, timezone
from genlayer import *


def _now() -> int:
    return int(datetime.now(timezone.utc).timestamp())


REVIEW_VERDICTS = ("APPROVE", "APPROVE_LIMITED", "REQUEST_MORE_EVIDENCE", "REJECT", "ESCALATE")
DEFAULT_VERDICTS = ("DEFAULT_CONFIRMED", "DEFAULT_DISPUTED", "DEFAULT_CURED", "ESCALATE")
APPEAL_VERDICTS = ("APPEAL_UPHELD", "APPEAL_REJECTED", "REQUEST_MORE_EVIDENCE", "ESCALATE")


class CredenceCredit(gl.Contract):
    # Data stores
    pools: TreeMap[str, str]
    policies: TreeMap[str, str]
    borrowers: TreeMap[str, str]
    wallet_to_borrower: TreeMap[str, str]
    reviews: TreeMap[str, str]
    loans: TreeMap[str, str]
    defaults: TreeMap[str, str]
    appeals: TreeMap[str, str]

    # On-chain index lists (DynArray of IDs for enumeration)
    pool_ids: DynArray[str]
    borrower_ids: DynArray[str]
    review_ids: DynArray[str]
    loan_ids: DynArray[str]
    default_ids: DynArray[str]
    appeal_ids: DynArray[str]

    def __init__(self) -> None:
        self.pools = TreeMap()
        self.policies = TreeMap()
        self.borrowers = TreeMap()
        self.wallet_to_borrower = TreeMap()
        self.reviews = TreeMap()
        self.loans = TreeMap()
        self.defaults = TreeMap()
        self.appeals = TreeMap()
        self.pool_ids = DynArray()
        self.borrower_ids = DynArray()
        self.review_ids = DynArray()
        self.loan_ids = DynArray()
        self.default_ids = DynArray()
        self.appeal_ids = DynArray()

    # ── Pool Management ────────────────────────────────────────────────────────

    @gl.public.write
    def create_pool(self, pool_id: str, name: str, description: str) -> None:
        if pool_id in self.pools:
            raise Exception("Pool already exists")
        pool = {
            "pool_id": pool_id,
            "lender_address": str(gl.message.sender_address),
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
        self.pool_ids.append(pool_id)

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
        self.borrower_ids.append(borrower_id)

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
            "fraud_flag": False,
            "confidence": 0,
            "red_flags_summary": "",
            "missing_evidence_summary": "",
            "consensus_memo": "",
            "created_at": str(_now()),
            "evaluated_at": None,
        }
        self.reviews[review_id] = json.dumps(review)
        self.review_ids.append(review_id)

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
        requested = int(review.get("requested_amount_native", 0))
        available = int(pool.get("available_native_liquidity", 0))

        prompt = f"""You are a credit arbitration engine for a GEN-native lending protocol.

POOL AVAILABLE LIQUIDITY (wei): {available}
REQUESTED LOAN AMOUNT (wei): {requested}
LENDER RISK POLICY: {json.dumps(policy)}
BORROWER REPUTATION PACKET: {json.dumps(packet)}

Rules:
- Never discriminate on protected characteristics
- Base decision only on: evidence quality, repayment history, wallet behaviour, loan purpose, policy match
- approved_amount_native must not exceed min(available, requested); set to 0 if not approving
- trust_score must be an integer 0-100
- fraud_flag must be true or false
- confidence must be an integer 0-100

Output ONLY a single line of valid compact JSON with exactly these keys:
{{"verdict":"APPROVE","risk_band":"LOW","trust_score":75,"approved_amount_native":{min(requested, available)},"requires_more_evidence":false,"fraud_flag":false,"confidence":85,"red_flags_summary":"","missing_evidence_summary":"","consensus_memo":"Borrower demonstrates credible repayment capacity."}}

Allowed verdict values: APPROVE, APPROVE_LIMITED, REQUEST_MORE_EVIDENCE, REJECT, ESCALATE"""

        def _leader():
            return gl.nondet.exec_prompt(prompt)

        def _validator(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            try:
                leader_out = json.loads(leaders_res.calldata)
                my_out = json.loads(_leader())
                return leader_out.get("verdict") == my_out.get("verdict")
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(_leader, _validator)

        try:
            out = json.loads(result)
            verdict = out.get("verdict", "REJECT")
            if verdict not in REVIEW_VERDICTS:
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
        review["fraud_flag"] = bool(out.get("fraud_flag", False))
        review["confidence"] = max(0, min(100, int(out.get("confidence", 0))))
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
        self.loan_ids.append(loan_id)

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
        self.default_ids.append(default_id)
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

        prompt = f"""You are a loan default arbitration engine.

LOAN DETAILS: {json.dumps(loan)}
DEFAULT REASON (lender): {review['reason']}
BORROWER RESPONSE: {review['borrower_response']}

Output ONLY a single line of valid compact JSON with exactly these keys:
{{"verdict":"DEFAULT_CONFIRMED","severity":"MEDIUM","borrower_fault_level":"HIGH","can_be_cured":false,"memo":"Brief explanation."}}

Allowed verdict values: DEFAULT_CONFIRMED, DEFAULT_DISPUTED, DEFAULT_CURED, ESCALATE"""

        def _leader():
            return gl.nondet.exec_prompt(prompt)

        def _validator(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            try:
                leader_out = json.loads(leaders_res.calldata)
                my_out = json.loads(_leader())
                return leader_out.get("verdict") == my_out.get("verdict")
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(_leader, _validator)

        try:
            out = json.loads(result)
            verdict = out.get("verdict", "DEFAULT_CONFIRMED")
            if verdict not in DEFAULT_VERDICTS:
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
        self.appeal_ids.append(appeal_id)

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

        prompt = f"""You are an appeal arbitration engine for a lending protocol.

ORIGINAL DECISION: {json.dumps(original)}
OLD VERDICT: {appeal['old_verdict']}
NEW EVIDENCE SUBMITTED: {appeal['new_evidence_summary']}

Output ONLY a single line of valid compact JSON with exactly these keys:
{{"verdict":"APPEAL_REJECTED","changed_original_decision":false,"requires_more_evidence":false,"memo":"Brief explanation."}}

Allowed verdict values: APPEAL_UPHELD, APPEAL_REJECTED, REQUEST_MORE_EVIDENCE, ESCALATE"""

        def _leader():
            return gl.nondet.exec_prompt(prompt)

        def _validator(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            try:
                leader_out = json.loads(leaders_res.calldata)
                my_out = json.loads(_leader())
                return leader_out.get("verdict") == my_out.get("verdict")
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(_leader, _validator)

        try:
            out = json.loads(result)
            verdict = out.get("verdict", "APPEAL_REJECTED")
            if verdict not in APPEAL_VERDICTS:
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
                review["consensus_memo"] = f"Appeal upheld: {str(out.get('memo', ''))[:200]}"
                self.reviews[target_id] = json.dumps(review)

    # ── Index / Enumeration Views ──────────────────────────────────────────────

    @gl.public.view
    def get_pool_count(self) -> int:
        return len(self.pool_ids)

    @gl.public.view
    def get_pool_id(self, index: int) -> str:
        return self.pool_ids[int(index)]

    @gl.public.view
    def get_borrower_count(self) -> int:
        return len(self.borrower_ids)

    @gl.public.view
    def get_borrower_id(self, index: int) -> str:
        return self.borrower_ids[int(index)]

    @gl.public.view
    def get_review_count(self) -> int:
        return len(self.review_ids)

    @gl.public.view
    def get_review_id(self, index: int) -> str:
        return self.review_ids[int(index)]

    @gl.public.view
    def get_loan_count(self) -> int:
        return len(self.loan_ids)

    @gl.public.view
    def get_loan_id(self, index: int) -> str:
        return self.loan_ids[int(index)]

    @gl.public.view
    def get_default_count(self) -> int:
        return len(self.default_ids)

    @gl.public.view
    def get_default_id(self, index: int) -> str:
        return self.default_ids[int(index)]

    @gl.public.view
    def get_appeal_count(self) -> int:
        return len(self.appeal_ids)

    @gl.public.view
    def get_appeal_id(self, index: int) -> str:
        return self.appeal_ids[int(index)]

    @gl.public.view
    def get_dashboard_stats(self) -> str:
        total_deposited = 0
        total_available = 0
        total_drawn = 0
        total_repaid = 0
        active_loans = 0
        pending_reviews = 0

        for pid in self.pool_ids:
            raw = self.pools.get(pid)
            if raw:
                p = json.loads(raw)
                total_deposited += p.get("pool_native_balance", 0)
                total_available += p.get("available_native_liquidity", 0)
                total_drawn += p.get("total_drawn_native", 0)
                total_repaid += p.get("total_repaid_native", 0)

        for lid in self.loan_ids:
            raw = self.loans.get(lid)
            if raw:
                l = json.loads(raw)
                if l.get("status") in ("ACTIVE", "PARTIALLY_REPAID"):
                    active_loans += 1

        for rid in self.review_ids:
            raw = self.reviews.get(rid)
            if raw:
                r = json.loads(raw)
                if r.get("status") == "PENDING":
                    pending_reviews += 1

        return json.dumps({
            "pool_count": len(self.pool_ids),
            "borrower_count": len(self.borrower_ids),
            "review_count": len(self.review_ids),
            "loan_count": len(self.loan_ids),
            "default_count": len(self.default_ids),
            "appeal_count": len(self.appeal_ids),
            "total_deposited": total_deposited,
            "total_available": total_available,
            "total_drawn": total_drawn,
            "total_repaid": total_repaid,
            "active_loans": active_loans,
            "pending_reviews": pending_reviews,
        })

    # ── Object Views ───────────────────────────────────────────────────────────

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
