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
