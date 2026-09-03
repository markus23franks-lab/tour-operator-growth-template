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
