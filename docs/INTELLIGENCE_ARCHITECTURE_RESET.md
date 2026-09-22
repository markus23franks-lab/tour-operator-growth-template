# Growth Operator Intelligence Architecture Reset
**Decision draft — September 22, 2026**

## Executive decision

Build 055 proved enough to justify a retool.

Do **not** continue growing the browser-side Operator Analyzer as GO's primary intelligence engine.

Preserve its evidence contracts, regression cases, deterministic validators, Opportunity Brain concepts and presentation discipline. Move research orchestration, semantic business understanding, investigative planning, cross-source reconciliation and commercial reasoning to a backend research system.

The target division of labor is:

```
URL
→ Backend Research Orchestrator
→ Model-driven Business Understanding
→ Investigation Planner
→ Provider Adapters / Rendered Browser
→ Normalized Evidence Store
→ Entity + Identity Reconciliation
→ Contradiction / Anomaly Engine
→ Model-driven Commercial Synthesis
→ Deterministic Truth Validation
→ Opportunity Brain
→ Action Plan
→ Growth Snapshot
→ Mission
```

This is not "replace GO with an LLM." Models decide what to investigate and interpret messy evidence. Providers acquire reality. Deterministic GO systems decide what may be stated as fact, what remains UNKNOWN, what is comparable, and what economic claims are allowed.

This directly implements the Founder reset: evidence must be able to create new questions, and GO must investigate like a consumer, growth expert, tour-industry expert, owner/CFO and investigative researcher.

---

## A. Current architecture: what it can and cannot do

### What it does well

The current system has created valuable contracts:

- first-party acquisition before judgment
- explicit business/product/transaction modeling
- provider-failure → UNKNOWN rather than fabricated gaps
- query-level provenance
- target identity reconciliation
- direct-competitor qualification
- product/price comparability gates
- conservative conversion/booking observations
- Opportunity Brain evidence states
- Action Plan states
- presentation integrity gates
- conceptual regression cases for Dockside, Louisville and Truckee

These should survive.

### Implementation problems we can fix without re-architecture

- malformed/undefined presentation leakage
- shallow product extraction
- exact-name reconciliation bugs
- stale state
- insufficient test fixtures
- weak page selection
- incomplete competitor enrichment
- inconsistent field schemas

### Structural limitations

1. **The browser is acting as orchestrator and analyst.** `operator-analyzer.js` has accumulated acquisition, semantic classification, query planning, competitor reading, market interpretation and presentation responsibilities. This makes iterative investigation brittle.

2. **The research plan is mostly predetermined.** GO can run a checklist, but evidence cannot naturally spawn a new research branch. Truckee requires: "I see two plausible entities; are they actually the same business?" That is an investigative loop, not a static card.

3. **Heuristics are doing semantic cognition.** Regex/keyword logic is useful for validation but is not a credible long-term engine for messy business models, owned vs resold inventory, nuanced positioning, traveler experience, or deciding which unexpected observation matters.

4. **Cross-surface evidence is not a first-class graph.** Search rows, local entities, pages, products, reviews and competitors are still largely separate objects. Truckee exposed the need to ask whether two observations refer to one entity and whether sources contradict one another.

5. **Current website acquisition is weak for rendered/visual experiences.** Direct HTML plus reader text cannot reliably represent JS-heavy pages, visual hierarchy, booking UI or traveler experience.

6. **Synchronous frontend execution encourages premature conclusions.** A genuinely useful investigation may need parallel provider calls, follow-up questions, retries, rendered screenshots and model synthesis. The operator should wait for a good investigation rather than receive a mediocre audit quickly.

Conclusion: Build 055 is not a failed codebase. It is a successful prototype that discovered where deterministic truth enforcement ends and research intelligence must begin.

---

## B. Proposed architecture

### 1. Frontend

The Analyzer becomes a thin client.

Responsibilities:
- accept URL
- start an investigation
- show useful progress states
- poll/stream investigation status
- render a completed, validated Snapshot
- never perform core research reasoning in the browser

### 2. Backend Research Orchestrator

Create a server-side investigation job.

Conceptual state machine:

```
QUEUED
→ ACQUIRING_FIRST_PARTY
→ UNDERSTANDING_BUSINESS
→ PLANNING_INVESTIGATION
→ RESEARCHING_MARKET
→ FOLLOWING_LEADS
→ RECONCILING
→ JUDGING
→ VALIDATING
→ COMPLETE | NEEDS_MORE_EVIDENCE | FAILED
```

The orchestrator owns:
- provider calls
- model calls
- parallelism
- retries/timeouts
- evidence persistence
- follow-up investigations
- budget/cost limits
- final schema validation

### 3. Model layer

Use a capable reasoning model for three bounded jobs rather than one giant "audit" prompt.

**Business Understanding**
Input: first-party pages + structured metadata.
Output: Business Dossier hypotheses and evidence references.

**Investigation Planner**
Input: validated Business Dossier + existing evidence.
Output: questions worth answering, why each matters, tools/surfaces to inspect, stop conditions.

**Commercial Synthesizer**
Input: normalized/reconciled evidence + unresolved contradictions.
Output: candidate strengths, constraints, anomalies, easy wins and investigations, each referencing evidence IDs and stating uncertainty.

The model may create new questions after evidence arrives. That is a required behavior.

### 4. Provider adapters

Provider-specific payloads must terminate at adapters. No downstream module should depend directly on SerpApi/DataForSEO/Firecrawl/etc.

Initial provider families:

- FIRST_PARTY_RENDERED
- ORGANIC_SERP
- LOCAL_MAPS
- BUSINESS_ENTITY
- REVIEW_REPUTATION
- COMPETITOR_SITE
- BOOKING_FLOW
- VISUAL_SCREENSHOT
- OTA_MARKETPLACE

Each adapter emits normalized Evidence Records.

### 5. Normalized Evidence Record

Minimum conceptual schema:

```json
{
  "id": "ev_...",
  "operatorId": "op_...",
  "investigationId": "inv_...",
  "surface": "LOCAL_MAPS",
  "claimType": "BUSINESS_ENTITY_OBSERVED",
  "subject": {"entityId": "entity_...", "label": "..."},
  "observation": {},
  "source": {"provider": "...", "url": "...", "query": "..."},
  "geography": {},
  "observedAt": "...",
  "confidence": "HIGH|MEDIUM|LOW",
  "status": "OBSERVED|INFERRED|UNKNOWN",
  "rawRef": "...",
  "contradicts": [],
  "supports": []
}
```

Raw provider payloads should be retained separately for debugging/replay.

### 6. Entity / identity reconciliation

This becomes a dedicated subsystem.

Entities:
- operator
- location/business listing
- website/domain
- product/offer
- competitor
- booking provider
- review profile
- OTA listing

Reconciliation should use deterministic identifiers where available:
- normalized domain
- phone
- address
- coordinates
- provider place/entity IDs
- booking links
- canonical URLs

Then use model-assisted semantic reconciliation for ambiguous cases.

Important: two similar listings do **not** become "duplicate listings." They become an anomaly such as:
`POSSIBLE_ENTITY_FRAGMENTATION`
with evidence and a follow-up investigation.

### 7. Contradiction / anomaly engine

Examples:
- organic presence observed while local provider says absent
- multiple local entities map to same domain/phone/address
- prices differ across first-party and OTA surfaces
- product described as rental on site but tour in market classification
- strong review count but reviews hidden/buried on booking path
- high visibility but weak traveler presentation relative to direct alternatives

The engine creates **questions**, not automatic defects.

### 8. Visual / consumer evidence

Rendered screenshots should become a real evidence surface.

Model vision can evaluate structured questions such as:
- Is the primary experience understandable above the fold?
- Is the booking CTA visually discoverable?
- Is pricing visible/understandable?
- Is trust proof prominent?
- Can the traveler distinguish products?
- Does mobile hierarchy obscure critical information?

Never store "site looks bad" as evidence. Store observable features and then reason about their likely commercial significance.

### 9. Deterministic validation

Before operator presentation:
- every factual claim references evidence IDs
- UNKNOWN cannot become a gap
- provider failure cannot become absence
- inferred entity matches remain labeled
- pricing recommendations require comparable offers
- economic estimates require explicit assumptions
- anomalies remain investigations until resolved
- model output that cites nonexistent evidence IDs is rejected
- contradictory high-confidence evidence blocks a definitive claim

### 10. Opportunity Brain

Opportunity Brain becomes downstream of the validated Investigation Dossier.

It should weigh:
- commercial upside
- evidence confidence
- recoverability
- effort
- risk
- speed
- operational fit
- measurement ability

Operator-facing classes:
- QUICK_WIN
- VALIDATED_OPPORTUNITY
- INVESTIGATE
- LEVERAGE
- MEASURE
- DO_NOT_PRIORITIZE

### 11. Persistence

Persist:
- investigation job
- Business Dossier
- evidence records
- entity graph
- questions
- provider raw references
- contradictions/anomalies
- validated findings
- final Snapshot
- cost/latency telemetry

This becomes the foundation for monitoring, memory and future connected-data learning.

---

## C. Keep / refactor / replace / retire

### KEEP

- Business Dossier schema concept
- Offer Evidence / comparable-price rules
- UNKNOWN discipline
- provenance requirements
- Competitive qualification principles
- Booking Journey evidence principles
- Positioning themes as supporting evidence
- Opportunity Brain states/concepts
- Action Plan concepts
- Presentation Gate
- Snapshot simplicity
- Dockside/Louisville/Truckee conceptual regressions

### REFACTOR

- Business Dossier creation → model-assisted backend output with deterministic validation
- Opportunity Brain → consume validated Investigation Dossier rather than browser research objects
- Presentation Gate → schema/evidence validation service
- provider normalization → backend adapters
- competitor qualification → entity-aware qualification using structured evidence

### REPLACE

- browser-side research orchestration
- regex/keyword heuristics as primary semantic understanding
- static one-pass research plan
- direct provider-shaped objects flowing through UI code
- text-only website acquisition as the main site representation

### RETIRE

- legacy heuristic findings once backend intelligence is active
- public proxy search fallbacks as production intelligence
- any card/section that exists mainly to expose research plumbing to operators
- benchmark/demo profiles in production customer flow

---

## D. Tooling / provider recommendation

### Primary search/local provider: DataForSEO, with provider abstraction

Why investigate first:
- dedicated Google Organic, Maps and Local Finder endpoints
- location-aware structured results
- extremely low marginal SERP cost
- Live mode advertised around seconds rather than minutes
- pay-as-you-go economics

GO should not permanently couple to it. Keep SerpApi as a useful secondary/fallback adapter during proof.

### Rendered website acquisition: Firecrawl

Use for:
- JS-rendered page extraction
- clean markdown
- links/metadata
- structured JSON where useful
- screenshots
- selected browser interactions

Do not use it as the reasoning layer.

### Jina Reader

Keep as a low-friction secondary reader/fallback. It is useful for LLM-friendly text but should not be the sole representation of a commercial website.

### Apify

Do not make it the default foundation initially. It is valuable as a specialist adapter marketplace for surfaces that prove difficult with primary providers. Its Google Maps actor economics are reasonable, but actor-level variability adds another operational dependency.

### SerpApi

Keep the adapter. It has already proven useful for organic/local evidence and can serve as fallback/cross-check. The reset is not "SerpApi is bad"; Truckee showed that GO's current orchestration/reconciliation was not capable enough.

### Model/orchestration: OpenAI Responses API

Recommended proof stack:
- GPT-5.6 Terra for Business Understanding / planning / routine synthesis
- escalate only difficult reconciliation or final commercial synthesis to GPT-5.6 Sol
- consider GPT-6 Astra later if evals show enough quality gain to justify cost
- structured outputs/function tools
- background Responses for investigations that exceed a normal request window
- vision on rendered screenshots
- custom tools that call GO provider adapters

Do not let the model browse arbitrarily and treat prose as evidence. Tool results must become Evidence Records first.

### Provider replaceability

Every provider implements an adapter contract. The Investigation Planner asks for capabilities (`LOCAL_MAPS_SEARCH`), never a vendor name.

---

## E. Smallest useful proof of concept

Do not rebuild the customer UI first.

Build a backend **Investigation Lab** that accepts a URL and emits a structured investigation JSON plus a developer-readable report.

The proof must demonstrate three generalized capabilities:

### Capability 1 — semantic commercial understanding
Across unfamiliar sites, identify:
- actual transaction model
- core inventory
- secondary/resold inventory when evidence supports it
- destination/market
- booking model
- representative traveler intents

Dockside class: rental must not silently become tour.

### Capability 2 — adaptive investigation
The planner starts with questions, receives evidence, and may create follow-up questions.

Example generic behavior:
- two local entities plausibly map to same operator
- create entity-integrity question
- compare IDs/domain/phone/address/reviews
- resolve or preserve as investigation

Truckee class: provider UNKNOWN must not override observed evidence on another surface.

### Capability 3 — commercially useful synthesis
Return:
- 2–4 strengths
- 0–3 validated opportunities
- 0–3 investigations
- easy wins when present
- what not to prioritize
- evidence for every claim
- no forced weakness

Louisville class: running searches is not itself an insight.

### Proof corpus

Use Dockside, Louisville and Truckee as conceptual regression cases, plus at least 5 unseen diverse operators:
- equipment rental
- food/walking
- private charter/water
- museum/admission
- off-road/adventure

Do not tune prompts or code to named fixtures.

### Proof pass standard

A proof passes only if:
- commercial model is materially correct
- important claims trace to evidence
- contradictory surfaces are reconciled or explicitly unresolved
- at least one non-obvious follow-up can be generated when evidence warrants it
- no fabricated gap from provider failure
- final report is something Builder would be comfortable putting in front of Founder

Only after this passes do we wire it into the customer-facing Analyzer/Snapshot.

---

## F. Evidence integrity

The model is allowed to hypothesize. GO is not allowed to present hypotheses as facts.

Required states:
- OBSERVED
- INFERRED
- UNKNOWN
- CONTRADICTED

Every candidate finding includes:
- evidence IDs
- confidence
- contradictory evidence IDs
- unanswered questions
- commercial rationale
- action boundary
- economic boundary

Validation rules should be executable code, not only prompt instructions.

---

## G. Cost / performance model

The exact cost must be measured in the proof, not guessed.

Target investigation shape for an unfamiliar operator:

- 5–10 first-party pages
- 4–8 representative search intents
- organic + local evidence for selected intents
- 2–4 qualified competitor sites
- 1–3 screenshots for operator and key competitors where visual comparison matters
- 2–4 model reasoning stages, with cheap/routine work separated from expensive synthesis

Provider calls should run in parallel where independent.

Expected latency goal for proof:
- roughly 30–120 seconds is acceptable if intelligence is materially better
- return progress states immediately
- deeper optional branches can continue asynchronously

Cost policy:
- log provider cost + model tokens per stage
- cache first-party pages and stable competitor evidence
- cache SERPs briefly by query/geography/device
- stop research when additional evidence is unlikely to change judgment
- escalate model quality only when ambiguity warrants it

The economics are favorable enough to prove quality before optimizing pennies. Current public provider pricing suggests SERP retrieval itself is unlikely to be the dominant cost; model reasoning and rendered/browser work will matter more.

---

## Architecture decision

**Proceed with a backend, model-driven Investigation Lab proof.**

Do not rewrite the full product.

Do not migrate all existing modules.

Do not ask Founder to test another incremental Analyzer.

First prove that the new engine can:
`UNDERSTAND → INVESTIGATE → NOTICE → RECONCILE → COMPARE → JUDGE`
at a materially higher level than Build 055.

If it cannot, revise the architecture before integration.

If it can, wrap the existing deterministic evidence contracts around it and make it the new cold-start intelligence engine.

The goal is not to protect Build 055.

The goal is to preserve what Build 055 taught us and finally give Growth Operator the kind of brain the product vision requires.
