## Growth Operator Intelligence Infrastructure Direction

Growth Operator should not become dependent on a single scraping or data provider.

The long-term intelligence architecture should separate GO's reasoning system from the providers used to collect evidence.

Conceptually:

Public / Connected Data Sources
↓
Provider Adapters
↓
Normalized GO Evidence
↓
Evidence Synthesis + Priority Reasoning
↓
GO Action
↓
Measurement + Learning

Potential intelligence sources include:

- Website crawling and extraction
- Search demand
- Organic search results
- Google Maps / local visibility
- Reviews and reputation
- Competitor websites
- Public pricing and offers
- Technical SEO
- Backlinks / authority
- Google Search Console
- Google Analytics
- Google Business Profile
- Online Booking Provider data

Jina successfully enabled the first Universal Public Scan, but it should not be treated as a permanent architectural constraint.

GO should continuously evaluate better retrieval/data providers when they materially improve:

- accuracy
- evidence depth
- speed
- reliability
- cost
- structured output
- monitoring capability

Potential providers explored include Firecrawl, DataForSEO, SerpApi, Apify and specialist local-search providers.

Build 028 should first attempt to prove valuable external market intelligence using inexpensive/public approaches without prematurely committing GO to a paid provider.

If reliable production-scale search, Maps, review or competitor intelligence requires paid infrastructure, GO should adopt it when the business value justifies the cost.

The governing principle is:

**Prove the intelligence first. Optimize the infrastructure second.**

Long term, GO should be capable of performing the work of an experienced organic-growth analyst with access to professional tools, but faster, persistently and across many operators.

GO's intelligence system must also support historical observations.

A market observation should eventually retain context such as:

- operator
- evidence type
- query
- geography
- device/surface where relevant
- observed value/rank
- competitors
- evidence source
- confidence
- timestamp

This enables GO to move from one-time analysis toward:

**Baseline → Monitor → Act → Measure → Learn → Repeat**## Intelligence Pipeline Observability — August 2026

Build 029 testing established that Operator Analyzer failures cannot reliably be diagnosed from the final Growth Snapshot alone.

The current conceptual intelligence pipeline is:

FIRST-PARTY WEBSITE EVIDENCE
↓
OPERATOR TRUTH
↓
COMMERCIAL INVENTORY
↓
MARKET-INTELLIGENCE PAYLOAD
↓
DEMAND / SEARCH GENERATION
↓
EXTERNAL MARKET RESULTS
↓
COMMERCIAL / COMPETITOR QUALIFICATION
↓
FINDING INPUT
↓
GO JUDGMENT

A critical architectural requirement is that commercial truth and evidence provenance survive each transition.

Example:

"This search exists because this confirmed primary product exists."

"This competitor is included because GO found evidence that it sells a commercially comparable experience."

"This finding exists because these specific pieces of evidence support it."

Build 029 testing with Shaggy's Diving demonstrated why this matters.

GO correctly understood the business as a Cayman Islands diving / boat / water-experience operator, yet downstream market investigation became overly generic and emphasized searches similar to "Cayman Islands tours."

This indicates that correct operator understanding can be weakened during downstream handoff or demand generation.

The next architectural step is therefore PIPELINE OBSERVABILITY rather than additional output-level heuristics.

Temporary/internal diagnostic tooling should expose:

1. Operator truth
2. Inventory truth
3. Market-intelligence input payload
4. All generated demand candidates
5. Selected searches and selection reasoning
6. Raw external results
7. Qualified commercial/competitor evidence
8. Final evidence passed into finding generation

This allows GO development to identify the exact seam where an incorrect conclusion originates rather than inferring upstream failures from final prose.

### State Isolation

Every Analyzer run must be isolated.

No operator-specific information from a prior run may survive into a new analysis, including:

- geography
- business identity
- competitors
- pricing
- search demand
- market evidence
- findings
- fallback language

A Shaggy's Diving test produced a Finding #3 containing Palm Springs language from prior FSA analysis.

This is a hard evidence-integrity failure and must be treated as a regression condition.

### Booking Technology Detection

OBP detection should remain an independent evidence process rather than depending solely on readable website text.

Potential evidence includes:

- raw HTML
- iframe URLs
- script URLs
- hrefs / booking links
- redirects
- known provider domains
- known provider signatures
- external booking-domain handoffs

Direct booking infrastructure and marketplace distribution remain separate concepts.

Examples of direct booking infrastructure may include:

Peek, FareHarbor, Junglebee, Bokun, Rezdy, Checkfront, Xola and similar OBPs.

Examples of marketplace/distribution surfaces include:

Viator, GetYourGuide, Tripadvisor and other OTAs.

GO should never claim an OBP without sufficient evidence.

"Booking flow detected; provider not confidently identified" is an acceptable conclusion.
## Discovery evidence provider model (Build 032)
Discovery Intelligence normalizes evidence from multiple providers into the existing Visibility system. Provider families: `organic`, `local`, `generative`, `social`, `marketplace`, and `authority`. Each provider should emit normalized evidence with source/surface, observed state, operator presence, competing presence, confidence, commercial intent, and provenance. Growth Score consumes only evidence that exists; an unavailable adapter must remain `not_checked` and must not reduce the score. Current Build 032 UI prepares this model using existing public web/search evidence without fabricating live AI/social/local checks. Google is a provider; GO's cross-provider judgment is the product.
## GO Intelligence Architecture — Evidence → Judgment → Opportunity
**Added: September 7, 2026**

Builds 036–038 materially clarified the Growth Operator intelligence architecture.

The current evidence providers are capable of returning substantially more useful public-market evidence than recent operator-facing Analyzer results suggested.

The emerging architecture is:

FIRST-PARTY ACQUISITION
↓
OPERATOR / INVENTORY MODEL
↓
GO RESEARCH PLANNER
↓
PROVIDER ADAPTERS
↓
NORMALIZED EVIDENCE
↓
GO REASONING / JUDGMENT
↓
OPPORTUNITY INTELLIGENCE
↓
PRIORITIZED OPPORTUNITY PORTFOLIO
↓
GROWTH SCORE
↓
MISSION
↓
EXECUTION
↓
MEASUREMENT
↓
MEMORY / REPRIORITIZATION

### Providers Are GO's Senses

External providers should retrieve evidence.

They should not determine what the operator should do.

SerpApi currently demonstrates useful ability to provide:

- organic search evidence
- Local/Maps evidence
- observed result positions
- named market competitors
- ratings
- review counts
- geographic evidence

SerpApi is therefore not currently proven to be the primary intelligence bottleneck.

Provider neutrality remains required.

Future providers may include:

- Google organic
- Google Local / Maps
- reviews / reputation
- public pricing
- website / conversion evidence
- OTAs / marketplaces
- AI / generative discovery
- social discovery
- Search Console
- Analytics
- booking / OBP data

All providers should feed normalized evidence into the same GO reasoning system.

### Judgment Is a Separate Layer

Build 038 introduced an explicit separation:

RAW EVIDENCE
→ GO JUDGMENT
→ OPERATOR CONCLUSION

This is foundational.

GO must be able to conclude:

"Do nothing here."

Strong evidence in one category does not mean that category contains the operator's best growth opportunity.

### Opportunity Intelligence

Evidence becomes an opportunity only after GO understands its commercial relevance.

A large observed gap does not automatically equal a high-priority opportunity.

Opportunity Intelligence should increasingly consider:

- commercial importance
- evidence confidence
- economic potential
- actionability
- urgency
- implementation effort / risk
- GO's ability to measure the outcome

The intelligence system should identify both:

GO PRIORITY
The best evidence-backed opportunity to work on now.

GO INVESTIGATION
The most economically promising unanswered question GO should investigate next.

## Intelligence Architecture Reset — September 22, 2026

Founder Test #3 (Truckee River Raft Company) established that Build 055's browser-side deterministic Analyzer is no longer the architecture to extend as GO's primary intelligence engine.

The durable decision is:

**Models investigate and reason. Providers acquire reality. Deterministic GO systems enforce truth.**

The next proof moves research orchestration to a backend Investigation Lab with:
- model-assisted Business Understanding
- adaptive Investigation Planning
- provider-neutral evidence adapters
- normalized evidence records
- entity/identity reconciliation
- contradiction/anomaly detection
- rendered/visual evidence where commercially relevant
- model-driven commercial synthesis
- deterministic provenance, UNKNOWN, comparability, confidence and economic gates
- Opportunity Brain and Action Plan downstream of validated evidence

Existing Build 055 work remains valuable as evidence contracts and validation boundaries. It should not be preserved as primary cognition merely because it already exists.

Canonical design and proof plan:
`docs/INTELLIGENCE_ARCHITECTURE_RESET.md`

Do not resume large-scale heuristic expansion in `operator-analyzer.js` unless a narrow deterministic rule is clearly the correct validation mechanism.

The next founder-facing intelligence checkpoint should demonstrate a materially different ability to understand, investigate, notice, reconcile, compare and judge—not another incremental Analyzer result.

## Mission outcome record — September 2026

The first broader-product slice after the research-to-dashboard bridge records a **real operator-supplied baseline, reported action and later measurement** against a researched claim. `js/mission-outcomes.js` scopes each record to website, claim ID, cited evidence IDs and headline; validates nonnegative values, dates, source, metric unit and matching period labels; locks the baseline after action; and requires an operator approval/performance attestation. The Mission exposes this as an optional Outcome record and the research dashboard reads back the same scoped state. An observed numerical difference is displayed as an observation. The action is `OPERATOR_REPORTED`, never `GO_EXECUTED`, and the result is not attributed revenue.

This is intentionally local browser storage for an internal product proof. It is not a production account record, secure shared storage, a connected booking/analytics source, a verified execution event, causal inference or automated reprioritization. The earlier `GOWorkEngine` defaults fabricate monitoring and journal activity for preview mode; do not connect those defaults to a researched operator as if they were actual GO work. Production continuation requires a durable operator/claim work record, approved execution boundary, connected source or verifiable manual evidence, and measured after-state. This slice establishes the state and language boundary without inventing those capabilities.
