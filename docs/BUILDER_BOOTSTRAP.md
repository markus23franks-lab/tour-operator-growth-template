# Builder Bootstrap — Growth Operator

**Purpose:** canonical starting point for a fresh Builder chat. Read this first, verify repository state, then follow links into deeper docs. Chats are working memory; the repository is institutional memory.

## 1. What Growth Operator Is

Growth Operator is an AI growth operating system for tour/activity operators.

**Booking platforms process bookings. Growth Operator creates more bookings.**

North-star loop:

**FIND MONEY → CHOOSE → ACT → MEASURE → LEARN → REPEAT**

Whole-product loop:

**UNDERSTAND → INVESTIGATE → JUDGE → PRIORITIZE → OPERATOR SURFACE → MISSION → EXECUTION → MEASUREMENT → MEMORY → NEXT OPPORTUNITY**

The current intelligence work is the brain that makes the rest of GO credible. It is not the whole product.

Read `COMPANY_FOUNDATION.md` before making product/architecture decisions.

## 2. Operator Standard

Given only a business URL, GO should increasingly behave like an exceptional growth employee combining:

- consumer/traveler perspective — would I book this business, and why might I choose a competitor?
- growth/web-agency perspective — what practical changes could improve acquisition, trust, merchandising or conversion?
- tour-industry perspective — what is actually sold, how is the transaction structured, and what matters commercially?
- owner/CFO perspective — where is recoverable revenue likely hiding and what is worth working on?
- investigative-research perspective — what does not add up, what contradicts other evidence, and what new question did the evidence create?

Desired reaction:

**GO understood my business → GO found something I did not know → that matters → I understand what GO would do → I want GO working on it.**

GO's judgment is the product. Raw observations are inputs.

## 3. Active Product Phase

**Build 055 / Cold-Start Intelligence V2 is active and NOT founder-accepted.**

Founder testing exposed a structural limitation in the prior frontend/deterministic Analyzer approach. The active question is no longer how to tune another query or heuristic. It is:

> **What architecture gives us the best realistic path to making GO behave like the exceptional growth operator we can already describe?**

The research loop now targets:

**UNDERSTAND → PLAN INVESTIGATION → COLLECT MULTI-SURFACE EVIDENCE → RECONCILE IDENTITY/ENTITIES → DETECT ANOMALIES/CONTRADICTIONS → FOLLOW NEW QUESTIONS → COMPARE → JUDGE → RECOMMEND/INVESTIGATE → EXPLAIN VALUE**

Search is one evidence source, not the brain.

## 4. Three Conceptual Regression Cases

Do not hardcode these operators. Preserve the failure classes.

### Dockside — commercial understanding
GO must understand what the operator actually sells and how the transaction works before generating demand or recommendations.

### Louisville Food Tours — useful investigation
Running searches is not growth analysis. Research must become commercially meaningful understanding, comparison, judgment and action.

### Truckee River Raft Company — reconciliation + curiosity
GO must reason across surfaces, notice contradictions/anomalies and allow evidence to create new investigations. Founder manually saw strong local presence and apparently multiple business entities where GO mainly reported uncertainty. The lesson is not “detect a Truckee duplicate”; it is “notice what deserves another question.”

## 5. Current Architecture Hypothesis

The direction under proof is approximately:

**URL → backend research/investigation orchestrator → business understanding → investigation planner → multi-surface research tools → structured evidence → identity/entity reconciliation → anomaly/contradiction detection → model-driven commercial reasoning → deterministic truth/validation guardrails → Opportunity Brain → Action Plan → Growth Snapshot → Mission**

This is a hypothesis, not sacred architecture. Challenge it with evidence.

Likely division of labor:

**Model/research layer:** semantic understanding, investigation planning, follow-up questions, qualitative comparison, anomaly interpretation, commercial reasoning.

**Providers/browser/tools:** website, search, local/Maps, reviews, competitor sites, products/pricing, booking journey, OTA/marketplace and other relevant public evidence.

**Deterministic GO systems:** provenance, evidence states, identity contracts, UNKNOWN discipline, provider-failure handling, comparable-price gates, confidence/economic/attribution boundaries, schema validation, presentation gates and regression contracts.

Do not replace brittle heuristics with an ungrounded “LLM browses and tells us what it thinks.” GO needs smarter investigation **and** stronger evidence discipline.

## 6. Evidence Integrity — Foundational

- Provider failure never equals operator absence.
- UNKNOWN does not equal BAD.
- Could not observe does not equal missing.
- Search gap does not automatically equal opportunity.
- Public prominence does not equal revenue share.
- A bare price is not pricing intelligence without offer/transaction context.
- Review count alone is not a commercial conclusion.
- Public conversion evidence does not establish actual conversion performance.
- Modeled Opportunity ≠ Measured Impact ≠ Attributed Revenue.

**GO should degrade confidence before it degrades truth.**

Economic ladder:

**PUBLIC OPPORTUNITY SCENARIO → DIRECTIONAL ESTIMATE → CONNECTED ESTIMATE → MEASURED GO IMPACT**

No fake ROI.

## 7. Quick Wins + Successful Operators

GO must work for healthy businesses, not only broken ones.

Customer maturity:

**FIX → CAPTURE → OPTIMIZE → EXPAND → DEFEND → DISCOVER AGAIN**

GO should distinguish work such as:

- QUICK WIN
- LOW-RISK OPTIMIZATION
- INVESTIGATE
- VALIDATED / MAJOR OPPORTUNITY
- LEVERAGE EXISTING STRENGTH
- MEASURE BEFORE ACTING

Commercial priority should consider upside, confidence, recoverability, effort, risk, speed and operational reality. A smaller safe improvement GO can execute quickly may outrank a larger theoretical opportunity.

## 8. Visual / Consumer Intelligence

Rendered/browser/multimodal evidence may be necessary because commercial experience can depend on visual hierarchy, photography, product merchandising, trust placement, mobile layout, pricing clarity, CTA prominence and perceived professionalism.

Do not permit unsupported “this website looks bad” judgments. Visual observations need evidence and commercial relevance.

A key question is:

> **Why might a traveler choose a qualified competitor even if this operator ranks well?**

## 9. Autonomous Builder Operating Contract

Builder is the technical owner, not a ticket taker.

Default loop:

**CAPABILITY/ACCEPTANCE → IMPLEMENT → SELF-REVIEW → REGRESSION → INSPECT → FIX → ITERATE → DOCUMENT → COMMIT → CONTINUE → MEANINGFUL FOUNDER TEST**

Builder should autonomously inspect repo state, make implementation decisions, evaluate tooling/providers, debug CI, run regressions, inspect failures, refactor/replace weak systems, update technical docs and commit stable checkpoints.

Interrupt Markus only for:

1. genuine founder/product/business judgment;
2. access/credentials Builder cannot obtain;
3. a materially different customer-facing capability worth founder evaluation.

Do not use Markus as the regression runner.

If Work mode stops without a founder decision, ask only for another `continue` prompt.

Read `WORKING_WITH_MARKUS.md` and `BUILD_CADENCE.md`.

## 10. Continuity / Git Discipline

A Builder chat may last only days. Assume your chat will end unexpectedly.

Commit meaningful stable checkpoints frequently.

At meaningful milestones update durable docs while context is fresh. Ask:

> **What did we learn that the next Builder would be materially worse off without?**

Do not wait for a final handoff to preserve critical knowledge.

At closeout or transition make explicit:

- SAVED TO GITHUB
- ACTIVE BRANCH
- CURRENT HEAD / meaningful commits
- CI / regression status
- VERIFIED vs UNVALIDATED work
- KNOWLEDGE SAVED / docs changed
- MERGE STATUS
- APPROVAL NEEDED / NO APPROVAL NEEDED
- exact unfinished next step

Never infer that the newest commit is trusted merely because it exists.

## 11. Current Handoff Warning

Builder 2 ended while work on `serpapi-investigation-adapter.mjs` was still unvalidated. Builder 3 inspected it, completed the end-to-end adapter regression, and passed all 25 local regression scripts. The adapter and regression were published on the Build 055 branch as `3957db4` and `3a578a0`; the final file trees match the original local commits. The next architectural proof requires a configured runtime with OpenAI and SerpApi credentials. No live operator corpus has yet validated provider recall or commercial judgment.

**Always verify current repository/CI state rather than treating this paragraph as permanently current.** Once the state changes, update this section.

## 12. Exit Condition for Dedicated Intelligence Work

Do not perfect the research engine forever.

Once unfamiliar operators consistently receive:

**UNDERSTAND → INVESTIGATE → NOTICE → COMPARE → JUDGE → IDENTIFY CREDIBLE WORK → EXPLAIN WHAT GO WOULD DO**

at a quality we would confidently show real operators, table intelligence as a dedicated build phase and move aggressively into the rest of GO:

**Growth Score → Missions → execution → connected data → measurement → memory → company website/public funnel → GO Account #1 → pricing/offer → onboarding → design partners/customers**

Research will keep improving from real use and outcomes.

## 13. Whole-Product Drift Check

Autonomy lets us move faster and therefore drift faster.

Before substantial next work ask:

> **Am I advancing Growth Operator's complete operating loop, or did the last technical problem pull me deeper into one subsystem?**

The intelligence engine exists to make the promises on the dashboard, Growth Score, Missions, execution and measurement true.

GO should eventually run GO itself:

**GO works on Growth Operator → executes → measures → learns → becomes the proof and acquisition flywheel.**

## 14. Required Reading Order for a Fresh Builder

1. `BUILDER_BOOTSTRAP.md` — this file
2. `COMPANY_FOUNDATION.md` — durable company/product soul
3. `WORKING_WITH_MARKUS.md` — founder/Builder operating contract
4. `BUILD_CADENCE.md` — autonomous build cadence
5. `BUILD_055_ACCEPTANCE.md` — active acceptance requirements
6. `ARCHITECTURE.md` — technical architecture/evidence contracts
7. `PRODUCT.md` — broader product model
8. `DECISIONS.md` — durable decisions and rationale
9. `ROADMAP.md` — sequence and deferred work
10. `BUILD_LOG.md` only when historical implementation context is needed

For live Investigation Lab evaluation, read `RESEARCH_EVALUATION_RUNTIME.md` before requesting credentials or creating a Netlify site. The private evaluation workspace is an architecture decision under implementation, not a completed live proof.

Then verify branch, HEAD, CI, tests and uncommitted/unvalidated work before coding.

## 15. Final Rule

Do not protect sunk cost.

Protect:

- the vision
- evidence integrity
- accumulated learning
- customer value
- founder leverage

**The goal is not to protect the code. The goal is to build Growth Operator.**
