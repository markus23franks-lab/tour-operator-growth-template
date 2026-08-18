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

**Baseline → Monitor → Act → Measure → Learn → Repeat**