# Build 055 — Cold-Start Intelligence V1 Acceptance

Build 055 is not complete because one benchmark looks better. It is complete when the cold-start system behaves credibly across different operator shapes.

## Operator contract
Input: one public website URL.

GO should independently determine, when public evidence supports it:
- business identity
- operating destination / traveler-facing geography
- bookable products
- commercial product families
- representative traveler search intent
- public discovery evidence
- public pricing evidence
- public trust evidence
- public conversion-foundation evidence
- the strongest next business investigation

The operator should not be asked to supply business name, location or commercial keywords during the public Analyzer flow.

## Search portfolio gate
- Prefer about 5 representative commercial searches; fewer is acceptable when evidence is narrow.
- Every query must map to a verified product family or clearly supported destination-product combination.
- Natural traveler language only.
- CTA/page-copy fragments can never become queries.
- Do not claim these are the highest-volume searches without verified volume data.
- Individual branded product names should not outrank their commercial family merely because they appear frequently on the website.

## Evidence gate
- OBSERVED_WIN requires observed operator presence.
- OBSERVED_GAP requires a checked result set with enough evidence to support absence.
- Provider failure / empty retrieval remains UNKNOWN.
- Mixed evidence is described as mixed; one weak rank does not automatically become a business priority.
- Exact positions are scoped to the exact query/result set observed.

## Judgment gate
Discovery becomes an operator-facing opportunity only when evidence is strong enough to change a business decision. A gap alone is not automatically the highest-priority growth move.

Pricing requires comparable-product validation before recommending a price change.

Conversion public signals establish a foundation, not actual conversion performance.

Trust evidence distinguishes operator reputation from competitor evidence.

## Pre-connection value gate
The public result must be useful before the operator connects private data:
- show concrete evidence, not only scores
- show what is working as well as possible opportunities
- explain what GO would do next
- use public scenario economics only when the math has a defensible public basis
- label assumptions clearly
- never manufacture ROI to force a sale

Connected data should feel like replacing assumptions with the operator's real economics, not like paying GO before GO can demonstrate value.

## Regression categories
The automated cold-start suite now covers:
- land/adventure
- water/tour/charter
- food/culinary
- off-road
- wildlife/sightseeing
- museum/admission
- sightseeing bus
- equipment rentals
- history/walking tours

Caicos remains a regression fixture, not the product design target. Moab remains a cold-start reality check, not a hardcoded exception.

## Automated acceptance status
Current Build 055 CI checks:
- Build 055 JavaScript syntax gate
- 9 cross-category cold-start product-family/query fixtures
- Opportunity Brain evidence-integrity checks
- Analyzer portfolio-level judgment checks
- zero-input Analyzer → Intelligence Lab search-handoff checks

Current status: all automated gates pass on the Build 055 branch.

The regression suite specifically protects these product rules:
- provider failure remains UNKNOWN
- a single search gap does not become a visibility opportunity
- repeated portfolio-level gaps can become an opportunity
- broadly healthy visibility is not converted into unnecessary SEO work
- malformed CTA/page-copy phrases do not reach the operator search portfolio
- the zero-input handoff preserves the representative portfolio and never serializes evidence objects as keyword text

## Founder test threshold
Do not request founder testing for individual filters, query wording patches or evidence plumbing.

The automated threshold is now met. The next founder test should evaluate the full one-URL experience across several previously unseen operators, with emphasis on:
1. Does GO understand what the business actually sells?
2. Are the representative searches commercially believable?
3. Does the public evidence feel credible and scoped correctly?
4. Does GO distinguish healthy, mixed and problematic visibility appropriately?
5. Does the resulting Snapshot make the operator want GO to keep working?

Build 055 should not be called fully accepted until that founder product test is complete.