# Credence

**Consensus-backed creditworthiness for under-collateralized lending.**

Credence is a GenLayer-native credit arbitration layer. It uses AI-validator consensus to review borrower reputation packets, identity attestations, repayment history, wallet behaviour, and loan-purpose evidence against lender risk policies — producing explainable credit decisions and safer collateral recommendations.

---

## What Credence Is

Credence is a reputation credit arbitration layer for under-collateralized lending. Borrowers should not be judged by collateral alone. Credence brings GenLayer consensus to reputation-backed lending decisions.

---

## What Problem It Solves

Most DeFi lending is over-collateralized. Borrowers must deposit 130%–200% of the loan value as collateral. This protects lenders but excludes borrowers who have credible reputation, verifiable income history, or proven repayment behaviour but limited excess capital.

Under-collateralized lending requires judgement. A normal smart contract can calculate collateral and enforce balances, but it cannot assess whether a borrower's identity attestations, repayment history, wallet behaviour, and loan purpose justify reduced collateral under a lender's specific risk policy.

---

## Why GenLayer Is Needed

Under-collateralized lending requires interpretation of:

- Is this borrower's reputation packet credible?
- Does the evidence justify reduced collateral?
- Is the loan purpose within the lender's allowed categories?
- Does a default explanation deserve an extension or restructuring?
- Does an appeal introduce enough new context to revise the credit decision?
- Should the borrower be upgraded, downgraded, restricted, or escalated?

These are judgement-heavy questions. GenLayer Intelligent Contracts evaluate them using the Equivalence Principle: validators must agree on core fields (credit tier, decision, collateral ratio) within acceptable variance.

---

## Why This Is GenLayer-Native

Under-collateralized lending requires interpretation of borrower reputation, identity attestations, repayment history, loan purpose, lender policy, and default context. Credence uses GenLayer Intelligent Contracts for these judgement-heavy credit decisions while keeping raw private documents and operational UI off-chain where appropriate.

A normal smart contract can check if collateral exists. GenLayer can judge whether reputation justifies reduced collateral.

---

## What the Contract Judges

- `review_borrower_credit(review_id)` — evaluates a reputation packet against a lender's risk policy
- `review_loan_request(loan_request_id)` — validates specific loan request terms
- `review_default(default_review_id)` — assesses whether a default explanation warrants extension or restructuring
- `review_credit_appeal(appeal_id)` — determines if an appeal introduces enough new evidence to revise a verdict

---

## What Is Stored On-Chain

- Borrower profile hash and wallet address
- Lender pool metadata
- Risk policy hash and plain-text criteria
- Reputation packet hash and evidence hash
- Structured credit verdicts (decision, tier, collateral ratio, reasoning, risk notes)
- Loan terms and repayment status
- Default review outcomes
- Appeal outcomes
- Protocol aggregate statistics

---

## What Is NOT Stored On-Chain

- Raw identity documents (passport, national ID, etc.)
- Bank statements or salary slips
- Government ID numbers (BVN, NIN, SSN, etc.)
- Full home addresses or private contact details
- Biometric data
- Unredacted private attestations
- Personal employer letters or customer invoices

---

## How Reputation Packets Work

A reputation packet is a structured summary submitted by the borrower. It includes:

- Wallet address and on-chain history summary
- Identity attestation hashes (from trusted issuers)
- Off-chain attestation summaries (income, DAO, employer)
- Loan purpose category and summary
- Requested credit tier and amount
- Evidence hashes for supporting documents
- Privacy statement

Raw private documents remain off-chain. Only hashes and summaries are submitted to GenLayer.

---

## How Lender Risk Policies Work

Each lending pool defines a risk policy that specifies:

- Minimum wallet age
- Minimum prior repayments
- Accepted evidence types
- Allowed and restricted loan purposes
- Collateral ratio bands per credit tier
- Maximum exposure per borrower
- Default grace period and appeal window
- Escalation triggers for human review

GenLayer validators evaluate borrower packets against this policy.

---

## How Collateral Recommendations Work

Credit tiers map to collateral bands:

| Tier | Collateral Band |
|------|----------------|
| TIER_0_UNREVIEWED | No under-collateralized access |
| TIER_1_TRIAL | 90%–100% |
| TIER_2_LIMITED | 60%–90% |
| TIER_3_TRUSTED | 35%–60% |
| TIER_4_HIGH_TRUST | 15%–35% |
| TIER_5_INSTITUTIONAL | Custom pool policy |
| RESTRICTED | No borrowing |
| DEFAULTED | No new borrowing until review |

GenLayer recommends where within the tier band the borrower sits based on evidence quality and confidence.

---

## How Repayments Update Reputation

Repayment is deterministic. The protocol records whether payment occurred without GenLayer. Successful repayments:

- Increment `successfulRepayments` on the borrower record
- Qualify the borrower for a tier upgrade review
- Improve future credit decisions

GenLayer is used only for disputes, default explanations, and restructuring.

---

## How Defaults and Appeals Work

**Defaults:** If a borrower misses a payment, they submit a default packet with their explanation, amount paid, and evidence hashes. GenLayer reviews the packet and outputs one of: `DEFAULT_CONFIRMED`, `EXTENSION_RECOMMENDED`, `PARTIAL_REPAYMENT_PLAN`, `RESTRUCTURE_RECOMMENDED`, `BORROWER_EXPLANATION_ACCEPTED`, `FRAUD_REVIEW_REQUIRED`, `LENDER_ERROR`, or `NEEDS_MORE_CONTEXT`.

**Appeals:** Borrowers can appeal credit rejections, low tiers, high collateral ratios, or default classifications. The appeal packet includes new context, counter-evidence summaries, and additional evidence hashes. GenLayer re-reviews and outputs one of: `UPHELD`, `TIER_UPGRADED`, `TIER_DOWNGRADED`, `COLLATERAL_RATIO_REDUCED`, `COLLATERAL_RATIO_INCREASED`, `REVIEW_AGAIN_WITH_MORE_EVIDENCE`, or `ESCALATED_TO_HUMAN`.

---

## How Transparency Works

The Transparency page shows aggregate protocol metrics only:

- Number of reviews, approval rate, rejection rate
- Average collateral ratio by tier
- Repayment rate, default rate
- Appeal rate, appeal reversal rate
- Average GenLayer confidence
- Privacy-preserving borrower count

No borrower names, private identity data, salary details, or raw documents are published.

---

## How to Run Locally

```bash
cd credence
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Deploy the Contract

1. Open GenLayer Studio at [https://studio.genlayer.com](https://studio.genlayer.com)
2. Create a new Intelligent Contract project
3. Upload `contract/CredenceCredit.py`
4. Deploy to Studionet
5. Copy the deployed contract address
6. Add it to `.env.local` as `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS`

---

## How to Connect Injected Wallet

1. Install MetaMask, Rabby, or another EVM-compatible browser wallet
2. Open Credence at `localhost:3000`
3. Click "Connect Wallet" in the navigation
4. Approve the connection in your wallet
5. Switch to GenLayer Studionet when prompted (Chain ID: 61999)

---

## Safety and Abuse Boundaries

Credence must not:
- Promise guaranteed loan approval
- Create public borrower shame boards
- Store raw identity documents on-chain
- Depend on biometric data
- Apply permanent social-credit labels
- Use predatory interest framing
- Base decisions on protected personal characteristics

Credence must:
- Provide explainable credit decisions
- Allow borrower appeals
- Show privacy notes on every verdict
- Route suspected fraud to human review
- Give borrowers a recovery path after default
- Handle uncertainty honestly (not claim 100% certainty)

---

## Demo Walkthrough

1. Open the Playground page for a step-by-step demo
2. Connect your wallet on the Settings page
3. Create a Lender Pool with a risk policy
4. Create a Borrower Passport
5. Submit a Reputation Packet on the Credit Reviews page
6. Trigger the GenLayer credit review
7. View the structured verdict and term sheet
8. Submit a Loan Request on the Loan Desk
9. Track repayment on the Repayments page
10. Submit a default or appeal if needed
11. View aggregate stats on the Transparency page
