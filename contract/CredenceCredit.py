# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
# CredenceCredit — GenLayer Intelligent Contract
# Credence: Consensus-backed creditworthiness for under-collateralized lending.
#
# What is stored on-chain:
#   - Borrower profile hash and wallet
#   - Lender pool metadata
#   - Risk policy hash and criteria
#   - Reputation packet hash and evidence hash
#   - Structured credit verdicts
#   - Loan terms and repayment status
#   - Default review outcomes
#   - Appeal outcomes
#
# What is NOT stored on-chain:
#   - Raw identity documents
#   - Bank statements or salary slips
#   - Government ID numbers (BVN, NIN, SSN, etc.)
#   - Full addresses or biometric data
#   - Unredacted private attestations

import json
from genlayer import *


class CredenceCredit(gl.Contract):
    borrowers: TreeMap[str, str]
    lender_pools: TreeMap[str, str]
    risk_policies: TreeMap[str, str]
    credit_reviews: TreeMap[str, str]
    loan_requests: TreeMap[str, str]
    loans: TreeMap[str, str]
    default_reviews: TreeMap[str, str]
    appeals: TreeMap[str, str]
    borrower_loans: TreeMap[str, str]
    pool_loans: TreeMap[str, str]
    stats: str

    def __init__(self) -> None:
        self.borrowers = TreeMap()
        self.lender_pools = TreeMap()
        self.risk_policies = TreeMap()
        self.credit_reviews = TreeMap()
        self.loan_requests = TreeMap()
        self.loans = TreeMap()
        self.default_reviews = TreeMap()
        self.appeals = TreeMap()
        self.borrower_loans = TreeMap()
        self.pool_loans = TreeMap()
        self.stats = json.dumps({
            "totalReviews": 0,
            "approvedCount": 0,
            "rejectedCount": 0,
            "pendingCount": 0,
            "totalLoans": 0,
            "totalRepaid": 0,
            "totalDefaults": 0,
            "totalAppeals": 0,
            "appealReversals": 0,
            "avgCollateralRatio": 0,
            "avgConfidence": 0,
            "totalBorrowers": 0,
            "totalPools": 0,
        })

    # ── Borrower Registration ──────────────────────────────────────────────────

    @gl.public.write
    def register_borrower(self, borrower_id: str, borrower_profile_json: str, profile_hash: str) -> None:
        profile = json.loads(borrower_profile_json)
        record = {
            "id": borrower_id,
            "wallet": profile.get("wallet", ""),
            "alias": profile.get("alias", ""),
            "profileHash": profile_hash,
            "currentTier": "TIER_0_UNREVIEWED",
            "reviewCount": 0,
            "successfulRepayments": 0,
            "defaults": 0,
            "createdAt": str(gl.message.timestamp),
        }
        self.borrowers[borrower_id] = json.dumps(record)
        stats = json.loads(self.stats)
        stats["totalBorrowers"] += 1
        self.stats = json.dumps(stats)

    # ── Lender Pool Registration ───────────────────────────────────────────────

    @gl.public.write
    def register_lender_pool(self, pool_id: str, pool_profile_json: str, risk_policy_hash: str) -> None:
        profile = json.loads(pool_profile_json)
        record = {
            "id": pool_id,
            "owner": profile.get("owner", ""),
            "name": profile.get("name", ""),
            "asset": profile.get("asset", "USDC"),
            "riskPolicyHash": risk_policy_hash,
            "minimumTier": profile.get("minimumTier", "TIER_1_TRIAL"),
            "maxLoanAmount": profile.get("maxLoanAmount", "0 USDC"),
            "maxDurationDays": profile.get("maxDurationDays", 30),
            "riskAppetite": profile.get("riskAppetite", "BALANCED"),
            "createdAt": str(gl.message.timestamp),
        }
        self.lender_pools[pool_id] = json.dumps(record)
        stats = json.loads(self.stats)
        stats["totalPools"] += 1
        self.stats = json.dumps(stats)

    @gl.public.write
    def register_risk_policy(self, pool_id: str, risk_policy_json: str, risk_policy_hash: str) -> None:
        policy = json.loads(risk_policy_json)
        policy["id"] = f"policy_{pool_id}"
        policy["poolId"] = pool_id
        policy["riskPolicyHash"] = risk_policy_hash
        policy["registeredAt"] = str(gl.message.timestamp)
        self.risk_policies[pool_id] = json.dumps(policy)

    # ── Reputation Packet and Credit Review ───────────────────────────────────

    @gl.public.write
    def submit_reputation_packet(
        self,
        review_id: str,
        borrower_id: str,
        pool_id: str,
        reputation_packet_json: str,
        evidence_hash: str,
    ) -> None:
        packet = json.loads(reputation_packet_json)
        record = {
            "id": review_id,
            "borrowerId": borrower_id,
            "poolId": pool_id,
            "reputationPacketHash": packet.get("packetHash", ""),
            "evidenceHash": evidence_hash,
            "reputationPacketJson": reputation_packet_json,
            "status": "SUBMITTED",
            "verdict": None,
            "createdAt": str(gl.message.timestamp),
        }
        self.credit_reviews[review_id] = json.dumps(record)
        stats = json.loads(self.stats)
        stats["totalReviews"] += 1
        stats["pendingCount"] += 1
        self.stats = json.dumps(stats)

    @gl.public.write
    def review_borrower_credit(self, review_id: str) -> None:
        review = json.loads(self.credit_reviews[review_id])
        packet = json.loads(review["reputationPacketJson"])
        pool_id = review["poolId"]

        policy_raw = self.risk_policies.get(pool_id)
        policy = json.loads(policy_raw) if policy_raw else {}

        prompt = f"""You are a credit arbitration system for under-collateralized lending. Review the borrower's reputation packet against the lender's risk policy and produce a structured credit verdict in valid JSON.

LENDER RISK POLICY:
{json.dumps(policy, indent=2)}

BORROWER REPUTATION PACKET:
{json.dumps(packet, indent=2)}

CREDIT TIERS AND COLLATERAL BANDS:
- TIER_0_UNREVIEWED: no under-collateralized access
- TIER_1_TRIAL: 90%-100% collateral required
- TIER_2_LIMITED: 60%-90% collateral required
- TIER_3_TRUSTED: 35%-60% collateral required
- TIER_4_HIGH_TRUST: 15%-35% collateral required
- TIER_5_INSTITUTIONAL: custom pool policy

IMPORTANT RULES:
1. Do NOT infer protected personal traits (race, ethnicity, religion, gender, disability, etc.)
2. Base your decision only on wallet behaviour, attestation confidence, repayment history, loan purpose, and lender policy
3. If fraud is suspected, set decision to FRAUD_REVIEW_REQUIRED
4. Be appropriately uncertain - reflect confidence honestly
5. Raw identity documents were not submitted - only hashes and summaries
6. Output valid JSON only. No additional text.

OUTPUT FORMAT:
{{
  "decision": "APPROVED_LIMITED_CREDIT | APPROVED_FULL_TERMS | APPROVED_WITH_HIGHER_COLLATERAL | NEEDS_MORE_EVIDENCE | REJECTED_HIGH_RISK | REJECTED_INSUFFICIENT_IDENTITY | REJECTED_INCONSISTENT_HISTORY | FRAUD_REVIEW_REQUIRED | HUMAN_REVIEW_REQUIRED",
  "creditTier": "TIER_0_UNREVIEWED | TIER_1_TRIAL | TIER_2_LIMITED | TIER_3_TRUSTED | TIER_4_HIGH_TRUST | TIER_5_INSTITUTIONAL | RESTRICTED | DEFAULTED",
  "recommendedCollateralRatio": 65,
  "maxApprovedAmount": "500 USDC",
  "interestRiskBand": "LOW | MEDIUM | HIGH | VERY_HIGH",
  "confidence": 0.78,
  "repaymentCapacity": "UNKNOWN | LOW | MODERATE | STRONG | VERY_STRONG",
  "identityConfidence": "NONE | LOW | MEDIUM | HIGH | VERY_HIGH",
  "reputationStrength": "NONE | WEAK | MEDIUM | STRONG | EXCELLENT",
  "fraudRisk": "LOW | MEDIUM | HIGH | CRITICAL",
  "reasoning": "concise non-discriminatory explanation of the credit decision",
  "termSheet": {{
    "loanLimit": "500 USDC",
    "minimumCollateral": "325 USDC",
    "durationDays": 30,
    "repaymentSchedule": "single repayment at maturity",
    "upgradeCondition": "condition to qualify for higher tier",
    "downgradeCondition": "condition that triggers downgrade"
  }},
  "riskNotes": ["list", "of", "specific", "risk", "factors"],
  "privacyNotes": "Raw identity documents were not stored on-chain. Only attestation hashes and summaries were considered.",
  "appealAvailable": true
}}"""

        result = gl.exec_prompt(prompt)

        try:
            verdict = json.loads(result)
        except Exception:
            verdict = {
                "decision": "HUMAN_REVIEW_REQUIRED",
                "creditTier": "TIER_0_UNREVIEWED",
                "recommendedCollateralRatio": 100,
                "maxApprovedAmount": "0 USDC",
                "interestRiskBand": "HIGH",
                "confidence": 0,
                "repaymentCapacity": "UNKNOWN",
                "identityConfidence": "NONE",
                "reputationStrength": "NONE",
                "fraudRisk": "MEDIUM",
                "reasoning": "Verdict parsing failed. Human review required.",
                "termSheet": {
                    "loanLimit": "0 USDC",
                    "minimumCollateral": "0 USDC",
                    "durationDays": 0,
                    "repaymentSchedule": "N/A",
                    "upgradeCondition": "N/A",
                    "downgradeCondition": "N/A",
                },
                "riskNotes": ["Automated review failed"],
                "privacyNotes": "Raw identity documents were not stored on-chain.",
                "appealAvailable": True,
            }

        review["verdict"] = verdict
        review["status"] = "REVIEWED"
        review["reviewedAt"] = str(gl.message.timestamp)
        self.credit_reviews[review_id] = json.dumps(review)

        borrower_id = review["borrowerId"]
        if borrower_id in self.borrowers:
            borrower = json.loads(self.borrowers[borrower_id])
            borrower["currentTier"] = verdict.get("creditTier", borrower["currentTier"])
            borrower["reviewCount"] = borrower.get("reviewCount", 0) + 1
            self.borrowers[borrower_id] = json.dumps(borrower)

        stats = json.loads(self.stats)
        stats["pendingCount"] = max(0, stats["pendingCount"] - 1)
        decision = verdict.get("decision", "")
        if "APPROVED" in decision:
            stats["approvedCount"] += 1
        elif "REJECTED" in decision or "FRAUD" in decision:
            stats["rejectedCount"] += 1

        total = stats["approvedCount"] + stats["rejectedCount"]
        if total > 0:
            stats["avgConfidence"] = (
                (stats["avgConfidence"] * (total - 1) + verdict.get("confidence", 0)) / total
            )

        ratio = verdict.get("recommendedCollateralRatio", 0)
        if ratio > 0 and total > 0:
            stats["avgCollateralRatio"] = (
                (stats["avgCollateralRatio"] * (total - 1) + ratio) / total
            )

        self.stats = json.dumps(stats)

    # ── Loan Request ──────────────────────────────────────────────────────────

    @gl.public.write
    def submit_loan_request(
        self,
        loan_request_id: str,
        borrower_id: str,
        pool_id: str,
        request_packet_json: str,
    ) -> None:
        record = {
            "id": loan_request_id,
            "borrowerId": borrower_id,
            "poolId": pool_id,
            "requestPacket": json.loads(request_packet_json),
            "status": "SUBMITTED",
            "verdict": None,
            "createdAt": str(gl.message.timestamp),
        }
        self.loan_requests[loan_request_id] = json.dumps(record)

    @gl.public.write
    def review_loan_request(self, loan_request_id: str) -> None:
        request = json.loads(self.loan_requests[loan_request_id])
        borrower_id = request["borrowerId"]
        pool_id = request["poolId"]

        borrower_raw = self.borrowers.get(borrower_id)
        borrower = json.loads(borrower_raw) if borrower_raw else {}
        policy_raw = self.risk_policies.get(pool_id)
        policy = json.loads(policy_raw) if policy_raw else {}

        prompt = f"""Review this loan request against the borrower's current credit tier and the lender's risk policy. Return a JSON verdict with approval status, recommended terms, and reasoning.

BORROWER: {json.dumps(borrower)}
LOAN REQUEST: {json.dumps(request["requestPacket"])}
RISK POLICY: {json.dumps(policy)}

Output valid JSON only:
{{
  "approved": true,
  "adjustedAmount": "500 USDC",
  "adjustedCollateralRatio": 65,
  "reasoning": "...",
  "conditions": ["list of conditions"]
}}"""

        result = gl.exec_prompt(prompt)
        try:
            verdict = json.loads(result)
        except Exception:
            verdict = {"approved": False, "reasoning": "Review failed. Manual review required."}

        request["verdict"] = verdict
        request["status"] = "REVIEWED"
        self.loan_requests[loan_request_id] = json.dumps(request)

    @gl.public.write
    def accept_loan_terms(self, loan_id: str, loan_request_id: str, accepted_terms_json: str) -> None:
        terms = json.loads(accepted_terms_json)
        record = {
            "id": loan_id,
            "loanRequestId": loan_request_id,
            "borrowerId": terms.get("borrowerId", ""),
            "poolId": terms.get("poolId", ""),
            "principal": terms.get("principal", ""),
            "collateral": terms.get("collateral", ""),
            "collateralRatio": terms.get("collateralRatio", 100),
            "durationDays": terms.get("durationDays", 30),
            "status": "ACTIVE",
            "createdAt": str(gl.message.timestamp),
            "dueAt": terms.get("dueAt", ""),
        }
        self.loans[loan_id] = json.dumps(record)

        borrower_id = terms.get("borrowerId", "")
        pool_id = terms.get("poolId", "")
        if borrower_id:
            existing_raw = self.borrower_loans.get(borrower_id)
            existing = json.loads(existing_raw) if existing_raw else []
            existing.append(loan_id)
            self.borrower_loans[borrower_id] = json.dumps(existing)
        if pool_id:
            existing_raw = self.pool_loans.get(pool_id)
            existing = json.loads(existing_raw) if existing_raw else []
            existing.append(loan_id)
            self.pool_loans[pool_id] = json.dumps(existing)

        stats = json.loads(self.stats)
        stats["totalLoans"] += 1
        self.stats = json.dumps(stats)

    @gl.public.write
    def record_repayment(self, loan_id: str, repayment_json: str) -> None:
        repayment = json.loads(repayment_json)
        loan = json.loads(self.loans[loan_id])
        loan["status"] = "REPAID"
        loan["repayment"] = repayment
        loan["repaidAt"] = str(gl.message.timestamp)
        self.loans[loan_id] = json.dumps(loan)

        borrower_id = loan.get("borrowerId", "")
        if borrower_id and borrower_id in self.borrowers:
            borrower = json.loads(self.borrowers[borrower_id])
            borrower["successfulRepayments"] = borrower.get("successfulRepayments", 0) + 1
            self.borrowers[borrower_id] = json.dumps(borrower)

        stats = json.loads(self.stats)
        stats["totalRepaid"] = stats.get("totalRepaid", 0) + 1
        self.stats = json.dumps(stats)

    # ── Default Review ─────────────────────────────────────────────────────────

    @gl.public.write
    def report_default(self, default_review_id: str, loan_id: str, default_packet_json: str) -> None:
        packet = json.loads(default_packet_json)
        record = {
            "id": default_review_id,
            "loanId": loan_id,
            "packet": packet,
            "status": "SUBMITTED",
            "outcome": None,
            "reasoning": None,
            "createdAt": str(gl.message.timestamp),
        }
        self.default_reviews[default_review_id] = json.dumps(record)

        loan_raw = self.loans.get(loan_id)
        if loan_raw:
            loan = json.loads(loan_raw)
            loan["status"] = "DEFAULT_REVIEW"
            self.loans[loan_id] = json.dumps(loan)

        stats = json.loads(self.stats)
        stats["totalDefaults"] = stats.get("totalDefaults", 0) + 1
        self.stats = json.dumps(stats)

    @gl.public.write
    def review_default(self, default_review_id: str) -> None:
        review = json.loads(self.default_reviews[default_review_id])
        packet = review["packet"]
        loan_raw = self.loans.get(review["loanId"])
        loan = json.loads(loan_raw) if loan_raw else {}

        prompt = f"""Review this loan default report and determine the appropriate outcome. Consider the borrower's explanation and evidence.

LOAN DETAILS: {json.dumps(loan)}
DEFAULT PACKET: {json.dumps(packet)}

Allowed outcomes:
DEFAULT_CONFIRMED | EXTENSION_RECOMMENDED | PARTIAL_REPAYMENT_PLAN | RESTRUCTURE_RECOMMENDED | BORROWER_EXPLANATION_ACCEPTED | FRAUD_REVIEW_REQUIRED | LENDER_ERROR | NEEDS_MORE_CONTEXT

Output valid JSON only:
{{
  "outcome": "EXTENSION_RECOMMENDED",
  "reasoning": "concise explanation of the decision",
  "gracePeriodDays": 7,
  "conditions": ["list of conditions if any"]
}}"""

        result = gl.exec_prompt(prompt)
        try:
            verdict = json.loads(result)
        except Exception:
            verdict = {"outcome": "NEEDS_MORE_CONTEXT", "reasoning": "Review failed. More context needed."}

        review["outcome"] = verdict.get("outcome")
        review["reasoning"] = verdict.get("reasoning")
        review["status"] = "REVIEWED"
        review["reviewedAt"] = str(gl.message.timestamp)
        self.default_reviews[default_review_id] = json.dumps(review)

    # ── Credit Appeal ──────────────────────────────────────────────────────────

    @gl.public.write
    def submit_credit_appeal(self, appeal_id: str, review_id: str, appeal_packet_json: str) -> None:
        packet = json.loads(appeal_packet_json)
        record = {
            "id": appeal_id,
            "reviewId": review_id,
            "packet": packet,
            "status": "SUBMITTED",
            "outcome": None,
            "reasoning": None,
            "createdAt": str(gl.message.timestamp),
        }
        self.appeals[appeal_id] = json.dumps(record)

        stats = json.loads(self.stats)
        stats["totalAppeals"] = stats.get("totalAppeals", 0) + 1
        self.stats = json.dumps(stats)

    @gl.public.write
    def review_credit_appeal(self, appeal_id: str) -> None:
        appeal = json.loads(self.appeals[appeal_id])
        review_id = appeal["reviewId"]
        original_raw = self.credit_reviews.get(review_id)
        original_review = json.loads(original_raw) if original_raw else {}
        original_verdict = original_review.get("verdict", {})

        prompt = f"""Review this credit appeal. Compare the original credit verdict against the new context and evidence provided in the appeal.

ORIGINAL CREDIT VERDICT:
{json.dumps(original_verdict, indent=2)}

APPEAL PACKET:
{json.dumps(appeal["packet"], indent=2)}

Allowed outcomes:
UPHELD | TIER_UPGRADED | TIER_DOWNGRADED | COLLATERAL_RATIO_REDUCED | COLLATERAL_RATIO_INCREASED | REVIEW_AGAIN_WITH_MORE_EVIDENCE | ESCALATED_TO_HUMAN

Consider: Does the appeal introduce enough new context to revise the original decision? Is the borrower's counter-evidence credible? Is the original decision consistent with the new information?

Output valid JSON only:
{{
  "outcome": "COLLATERAL_RATIO_REDUCED",
  "reasoning": "explanation of appeal decision",
  "revisedCollateralRatio": 55,
  "revisedTier": "TIER_2_LIMITED",
  "confidence": 0.82
}}"""

        result = gl.exec_prompt(prompt)
        try:
            verdict = json.loads(result)
        except Exception:
            verdict = {"outcome": "ESCALATED_TO_HUMAN", "reasoning": "Appeal review failed. Human review required."}

        appeal["outcome"] = verdict.get("outcome")
        appeal["reasoning"] = verdict.get("reasoning")
        appeal["status"] = "REVIEWED"
        appeal["reviewedAt"] = str(gl.message.timestamp)
        self.appeals[appeal_id] = json.dumps(appeal)

        positive = {"TIER_UPGRADED", "COLLATERAL_RATIO_REDUCED"}
        if verdict.get("outcome") in positive:
            stats = json.loads(self.stats)
            stats["appealReversals"] = stats.get("appealReversals", 0) + 1
            self.stats = json.dumps(stats)

    # ── View Methods ───────────────────────────────────────────────────────────

    @gl.public.view
    def get_borrower(self, borrower_id: str) -> str:
        raw = self.borrowers.get(borrower_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_lender_pool(self, pool_id: str) -> str:
        raw = self.lender_pools.get(pool_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_risk_policy(self, pool_id: str) -> str:
        raw = self.risk_policies.get(pool_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_credit_review(self, review_id: str) -> str:
        raw = self.credit_reviews.get(review_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_loan_request(self, loan_request_id: str) -> str:
        raw = self.loan_requests.get(loan_request_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_loan(self, loan_id: str) -> str:
        raw = self.loans.get(loan_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_default_review(self, default_review_id: str) -> str:
        raw = self.default_reviews.get(default_review_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_credit_appeal(self, appeal_id: str) -> str:
        raw = self.appeals.get(appeal_id)
        return raw if raw else "{}"

    @gl.public.view
    def get_borrower_loans(self, borrower_id: str) -> str:
        raw = self.borrower_loans.get(borrower_id)
        return raw if raw else "[]"

    @gl.public.view
    def get_pool_loans(self, pool_id: str) -> str:
        raw = self.pool_loans.get(pool_id)
        return raw if raw else "[]"

    @gl.public.view
    def get_protocol_stats(self) -> str:
        return self.stats
