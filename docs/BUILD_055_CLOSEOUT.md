# Build 055 — Cold-Start Intelligence V1 Closeout

## Status

**Automated implementation gate: COMPLETE — CI run #31 passed after public Analyzer integration**

**Founder product acceptance: PENDING**

Build 055 should not be merged or described as fully accepted until the founder runs the one-URL experience against several previously unseen operators and judges the resulting Snapshot credible, useful and commercially interesting.

## Final integration checkpoint — 2026-09-21

The public Analyzer now loads the Pricing, Trust, Conversion and Opportunity Brain layers directly. The Opportunity Brain can therefore arbitrate among public growth senses instead of treating search as the product. Public Pricing and Trust remain conservative when dedicated comparable evidence is unavailable; they stay UNKNOWN rather than manufacturing a recommendation.

Cold-start product inference was also hardened to distinguish operator-owned product evidence from incidental destination language. Regression coverage now includes a food-tour operator mentioning unrelated local boat charters and a rental operator mentioning activities guests can do with the rental. Both cases must preserve the operator's actual transaction model rather than create false commercial searches.

CI run #31 passed the complete Build 055 gate after these changes, including Analyzer syntax, the 11-fixture product-family suite, Opportunity Brain evidence integrity, portfolio judgment, and zero-input handoff.

## Autonomous intelligence expansion — 2026-09-21 late pass

GO now carries a qualified competitive-intelligence layer through the one-URL research dossier and into the operator brief. A single search appearance is not enough to call another business a strategic competitor. Direct operators must recur across relevant commercial demand; marketplaces and destination authorities remain context rather than direct competitors. When a repeated direct operator appears where the target has multiple verified gaps, GO may surface competitor pressure and recommend a product/offer/trust/booking-path comparison. When the target is already visible, the same rival remains market context rather than a manufactured problem.

The live Growth Snapshot no longer renders legacy fabricated review counts or example search rankings for prospect scans. Live scans show recovered research evidence only. Unknown signals are also kept out of the three operator priority cards unless they are the primary unresolved question; weak unknowns do not crowd out verified strengths or opportunities.

Opportunity Brain now resolves simultaneous verified opportunities by commercial leverage rather than defaulting toward search. Current ordering is conversion evidence when it becomes a true opportunity, then pricing, trust, and discovery; regression coverage protects pricing-over-trust/discovery and trust-over-discovery cases.

CI run #55 passed after adding the competitive-intelligence module and its five-case regression suite.

## Capability delivered

Build 055 establishes the first disciplined cold-start contract for Growth Operator:

```
one public URL
→ business identity
→ traveler-facing geography
→ verified product inventory
→ commercial product families
→ representative traveler search portfolio
→ public market evidence
→ evidence-aware judgment
→ Opportunity Brain
→ operator Snapshot
```

The operator is not expected to provide business name, location or keywords in the public Analyzer flow.

## Representative search portfolio

The cold-start system now selects a small representative portfolio, generally up to five searches, from verified product families and destination context.

The portfolio is intentionally not a giant keyword list. It is a commercial investigation sample.

Guardrails:
- searches must map to supported inventory or destination-product combinations
- natural traveler language only
- CTA and page-copy fragments are rejected
- branded product names do not automatically outrank their commercial family
- GO does not claim these are the highest-volume searches without verified demand-volume evidence

## Evidence contract

Build 055 separates the search plan from the evidence returned for that plan.

- `market.queries` may contain the representative query strings in cold-start profile/debug data.
- `market.queryResults` contains the corresponding evidence rows when Build 055 has executed the checks.
- Legacy Intelligence Lab payloads may still expose object-shaped evidence rows in `market.queries`.
- Opportunity Brain V2.2 prefers `market.queryResults` and only falls back to object-shaped legacy `market.queries`.
- String query arrays can never masquerade as verified evidence.

This compatibility rule allows the current Lab to remain useful without weakening the new cold-start evidence boundary.

## Judgment contract

Discovery evidence follows these rules:

- provider failure or empty retrieval remains **UNKNOWN**
- one observed gap does not automatically become a business opportunity
- mixed evidence remains mixed/unresolved
- repeated commercially meaningful gaps can become an opportunity
- strong observed visibility can be explicitly healthy
- healthy visibility does not cause GO to manufacture SEO work
- exact positions apply only to the exact query/result set observed

Pricing, Trust and Conversion remain separate evidence senses feeding the same Opportunity Brain.

Pricing requires comparable-product validation before GO recommends a price change.

Public conversion signals establish a foundation; they do not prove actual conversion performance.

Trust evidence distinguishes the operator's reputation from competitor evidence.

## Zero-input handoff

The Analyzer → Intelligence Lab → Snapshot handoff now preserves the representative portfolio selected by Build 055.

In the one-URL autopilot path:
- the handoff prefers `pipelineDebug.selectedQueries`
- values are normalized and deduplicated
- malformed queries are rejected
- the portfolio is capped at five
- legacy Intelligence Lab demand expansion is disabled for that path
- evidence objects are never serialized into keyword text

This prevents five deliberate representative searches from silently becoming a broader legacy ten-query portfolio before the Snapshot is created.

## Opportunity Brain behavior

Opportunity Brain V2.2 consumes Discovery, Pricing, Trust and Conversion and chooses the strongest defensible next investigation.

Important behavior:
- UNKNOWN is preserved
- public findings are not automatically promoted into work
- pricing can lead when public evidence supports a pricing-power investigation
- conversion remains unresolved without performance data
- when discovery is healthy and the public booking foundation exists, GO can move toward the next growth edge instead of inventing a weakness
- reliable operator-specific ROI remains gated on connected first-party economics

## Automated regression coverage

The Build 055 workflow currently runs:

1. JavaScript syntax checks across the cold-start, judgment, handoff, Opportunity Brain, Snapshot brief and Intelligence Lab handoff surfaces.
2. Nine cross-category product-family/query fixtures:
   - land/adventure
   - water/tour/charter
   - food/culinary
   - off-road
   - wildlife/sightseeing
   - museum/admission
   - sightseeing bus
   - equipment rentals
   - history/walking tours
3. Opportunity Brain evidence-integrity regression.
4. Analyzer portfolio-level judgment regression.
5. Zero-input handoff regression.

The suite protects:
- provider failure → UNKNOWN
- single gap → unresolved
- mixed evidence → unresolved
- repeated meaningful gaps → opportunity
- strong visibility → healthy
- insufficient verified coverage → unresolved
- Build 055 `queryResults` evidence contract
- string query arrays cannot become evidence
- representative portfolio preservation through zero-input handoff
- CTA/page-copy leakage rejection
- no legacy demand re-expansion in the autopilot path

## Known V1 boundaries

Build 055 does not claim:
- verified search volume
- exhaustive discovery-channel coverage
- actual conversion rate
- operator-specific revenue impact from public evidence alone
- complete comparable-product pricing certainty
- complete first-party business understanding

Those are intentional evidence boundaries, not reasons to manufacture precision.

## Founder acceptance test

The next founder test should use several previously unseen and diverse operators.

For each operator, judge:

1. **Business understanding** — Did GO understand what the business actually sells and where it operates?
2. **Search credibility** — Are the representative searches commercially believable?
3. **Evidence credibility** — Are observed wins, gaps and unknowns scoped correctly?
4. **Judgment quality** — Does GO distinguish healthy, mixed and problematic evidence without forcing a weakness?
5. **Operator value** — Does the Snapshot make the operator want GO to keep working?

The Analyzer V1 product standard remains approximately **4 of 5 unfamiliar cold analyses credible enough to discuss with the operator without operator-specific tuning**.

## After acceptance

Once founder testing clears that threshold:

1. freeze Cold-Start Intelligence / Analyzer V1 as a dedicated build phase
2. merge Build 055
3. move primary product effort to Operator Snapshot / Growth Score V2
4. continue Analyzer intelligence as a subsystem that improves through regression fixtures and real operator learning rather than endless dedicated tuning

Build 055 is infrastructure for the larger Growth Operator loop:

```
public investigation
→ Growth Snapshot
→ prioritized opportunity
→ Growth Review
→ connected baseline
→ GO execution
→ measured impact
→ memory
→ next priority
```


## V2 architecture correction — 2026-09-22

Founder product acceptance for the original Build 055 experience is **not complete and must not be inferred from green CI**. Dockside DVI and Louisville Food Tours exposed a deeper product problem: GO could have mechanically valid search evidence while still misunderstanding the operator or producing research that was not commercially interesting. Those tests superseded the earlier expectation that Build 055 could close on query-quality alone.

The cold-start architecture is now explicitly:

```
UNDERSTAND
→ RESEARCH
→ COMPARE
→ JUDGE
→ RECOMMEND
→ EXPLAIN VALUE
```

A formal Business Dossier is now built before market research. It carries business identity, operating market, commercial transaction model, commercial-truth product inventory, booking-provider evidence and first-party provenance. If identity, commercial inventory or operating market cannot be established, GO stops before competitor/search judgment rather than allowing a bad business model to contaminate downstream research.

Pricing has also gained a separate comparable-offer layer. Loose public price medians may remain directional evidence, but a pricing-power opportunity is suppressed unless GO can establish a like-for-like set across compatible product family and transaction type; observed duration/format differences must also be compatible. Multiple independent sources are required before the set is promoted.

Competitive pressure and relative positioning now survive into Opportunity Brain as strategic context without automatically becoming fake opportunities. Positioning parity can change what GO investigates next while remaining distinct from a verified revenue constraint.

The Analyzer now exposes an operator-facing GO Research Brief so the visible product explains the business GO believes it is operating, verified products, market context, positioning, reputation/pricing state, current judgment and evidence already working. This is the beginning of the V2 operator experience, not founder acceptance.

Regression coverage now additionally protects Business Dossier integrity, dossier-first pipeline ordering, qualified competitor positioning comparison, presentation integrity and like-for-like offer comparison.

**Current founder status:** no action required. Builder should continue autonomously until the one-URL experience represents a material product-capability jump. Do not ask the founder to rerun Louisville or act as a mechanical regression tester.


## V2 commercial judgment slice — 2026-09-22

The cold-start V2 stack now goes materially beyond search evidence. First-party product evidence enriches the Business Dossier with observed price, duration, format, transaction model and source provenance. Qualified competitor pages are also converted into structured product evidence so pricing comparison can prefer actual competitor offers over loose search snippets.

Comparable pricing is intentionally strict: loose snippets can remain directional evidence, but they cannot verify a pricing set. A promoted comparable set now requires structured competitor offers, matching commercial family/transaction type, observed duration and format compatibility, and multiple independent sources. Missing fields are not proof of equivalence.

A conservative Booking Journey layer records positive public evidence for CTA, public price, product detail path and booking destination. It does not turn missing extraction into a conversion defect. A Product Architecture layer can identify repeated adjacent offer patterns across multiple direct competitors or flag differentiation as worth investigating when repeated competitor pressure coincides with category-parity positioning. These remain investigations rather than fabricated opportunities.

An evidence-ranked Action Plan now separates VALIDATED_OPPORTUNITY, INVESTIGATE, LEVERAGE and MEASURE moves. The visible Analyzer and Snapshot use this synthesis for the next move instead of presenting every research signal as equivalent work.

A runtime Presentation Gate now blocks malformed identity, unresolved core commercial truth, transaction-model conflicts, raw sentinel leakage and action plans that promote opportunities the Opportunity Brain did not validate. Failed presentation integrity prevents Analyzer → Snapshot handoff; GO holds the result rather than showing a polished but untrustworthy growth story.

CI now covers offer evidence, strict comparable offers, booking journey, product architecture, action-plan synthesis, runtime presentation integrity, dossier-first ordering and trusted-only Snapshot handoff. Latest completed regression run at this checkpoint: #169 SUCCESS.

Founder acceptance remains open. Do not treat green regressions as product acceptance; the next founder checkpoint should be a materially credible one-URL experience, not another mechanical test.


## Founder Test #3 — Truckee River Raft Company — 2026-09-22

**Result: FAILED — architecture improved, operator intelligence still not credible enough.**

Founder tested `https://truckeeriverraft.com/` and independently checked the exact query GO surfaced: `Tahoe City rafting tours`.

GO reported mixed/unresolved search visibility and said it could not verify Google/Maps results strongly enough. A direct Google check showed Truckee River Raft Company prominently in the local/business results, including what appear to be two separate Truckee River Raft Company entities/listings. The operator-facing result therefore missed both the obvious positive visibility evidence and a potentially more valuable anomaly.

This is not a wording problem. It exposes an evidence-reconciliation and investigation-depth problem.

### What the Truckee test exposed

- GO still allowed a provider limitation to dominate the visible conclusion even when another public surface could establish visibility.
- One checked search is not a credible market investigation.
- The business description remained generic classifier language: `multi-segment tour operator (boat / water / diving experiences + outdoor adventure)`, not a crisp understanding of the actual rafting operation.
- Public prices such as `$7 · $8 · $40` were displayed without product/package context, so the information was not commercially useful.
- Raw implementation leakage remained visible: `rafting tours: undefined`.
- Empty/weak evidence sections such as `Demand families compared` remained on screen.
- GO spent too much operator-facing space explaining uncertainty and too little surfacing useful business observations.
- Most importantly, GO failed to notice that the apparent duplicate local business entities may be a more interesting investigation than generic visibility itself.

The founder's product insight is important: if the two local entities truly represent the same operation, GO should investigate whether they are intentional separate locations or duplicate/fragmented listings. Only after verification should GO consider recommending consolidation. The potential business issue is fragmented review authority, weaker visible trust, inconsistent information or traveler confusion — not simply “you do not rank.”

### Required architectural correction

The next cold-start architecture must add an explicit evidence-reconciliation / investigation layer:

```
UNDERSTAND
→ BUILD INVESTIGATION PLAN
→ COLLECT MULTI-SURFACE EVIDENCE
→ RECONCILE IDENTITY + ENTITIES
→ DETECT ANOMALIES
→ COMPARE
→ JUDGE
→ RECOMMEND / INVESTIGATE
→ EXPLAIN VALUE
```

Search is one evidence source. A provider returning UNKNOWN must not become the business conclusion when organic SERP, local/maps entities, first-party evidence or another qualified source resolves the question.

For important commercial questions, GO should be able to reconcile:
- organic search presence
- local / Maps entities
- business-name and identity variants
- operator website evidence
- review/reputation entities
- qualified direct competitors
- OTA/marketplace context where useful
- pricing/product evidence
- booking path evidence

The engine should then inspect contradictions and anomalies inside the evidence rather than merely scoring the original query.

### Desired Truckee-quality output

The target behavior is closer to:

> Truckee River Raft Company is already visibly present for core Tahoe City rafting demand, so generic visibility is not where GO would start. GO found what appear to be two separate local business entities representing the company. Before recommending SEO work, GO would verify whether these are intentional locations or fragmented listings because consolidation could potentially strengthen review authority and reduce traveler confusion. GO would then compare review strength/velocity, product positioning and the booking journey against the strongest direct rafting alternatives.

That example is a product-direction target, not a hardcoded Truckee answer. The system must earn each statement from public evidence.

### Regression role

Truckee joins Dockside DVI and Louisville Food Tours as a permanent conceptual regression case:

- **Dockside:** understand the commercial / transaction model before generating demand.
- **Louisville:** do not mistake shallow search analysis for useful growth intelligence.
- **Truckee:** reconcile contradictory evidence and detect higher-value anomalies inside the market evidence.

Do not hardcode any of these businesses. Each represents a class of intelligence failure.

### Builder self-awareness / retooling mandate

Founder explicitly wants Builder to act as both a strong developer and a product-aware technical partner. Do not keep extending an architecture merely because code can be added to it. If the current provider stack, deterministic heuristics, evidence model, browser/runtime constraints or overall approach cannot plausibly produce the desired “great growth operator” behavior, stop and surface the constraint.

The company is not committed to the current implementation path. Retooling is acceptable and expected when it creates a better route to the product vision.

Before another large implementation pass, Builder should explicitly evaluate:

1. whether the current public-data providers can reliably retrieve the surfaces GO needs;
2. whether deterministic browser-side heuristics are still being asked to perform reasoning better suited to a model/research-agent layer;
3. whether multi-surface entity reconciliation needs a new backend research service rather than more Analyzer logic;
4. whether live web/browser research or a stronger search/local data provider is required for Google/local evidence;
5. whether the current frontend-heavy orchestration should be replaced by a durable research dossier produced server-side;
6. which current modules remain valuable as evidence contracts/guardrails even if the research engine is retooled.

**Do not ask Founder to run more operators until this architectural review is complete and the Truckee class of failure has been materially addressed.**

## Reset handoff — 2026-09-22

### Current status

Build 055 / Cold-Start Intelligence V2 remains **ACTIVE and NOT FOUNDER-ACCEPTED**.

Latest founder-visible test: Truckee River Raft Company — FAILED.

Automated regressions are useful engineering gates, but green CI is not evidence that the operator experience is good. Builder previously over-weighted architecture/regression progress and called for founder testing too early. That should not repeat.

### What is worth preserving

The recent build work is not discarded. The following are useful foundations regardless of retooling direction:

- formal Business Dossier and dossier-first ordering
- separation of business category from transaction model
- first-party product evidence/provenance
- qualified-direct-competitor discipline
- comparable-offer pricing gate
- conservative Booking Journey evidence
- Product Architecture investigations
- Opportunity Brain evidence states
- Action Plan distinction between VALIDATED_OPPORTUNITY / INVESTIGATE / LEVERAGE / MEASURE
- UNKNOWN discipline
- runtime Presentation Gate
- trusted-only Analyzer → Snapshot handoff
- regression corpus and evidence-integrity tests

These should become contracts around a smarter research engine rather than reasons to preserve weak heuristics.

### Immediate next meeting question

Before coding the next major slice, Founder and Builder should align on the research-engine decision:

**Can the current stack realistically become the autonomous multi-surface investigator GO needs, or is now the right time to introduce/retool around a stronger research/model/browser layer?**

The standard is not “can we improve the current output?” It is:

**Can this architecture plausibly produce an operator experience that feels like a great growth employee studied the business, noticed what matters, investigated contradictions, and returned with a small number of commercially meaningful observations?**

If the answer is no or only with excessive brittle heuristics, retool.
