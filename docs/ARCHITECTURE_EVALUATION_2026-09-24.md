# Investigation Lab architecture evaluation — September 24, 2026

## Decision read

Putting model reasoning inside GO produced a **materially different kind of output** from query tuning: it can preserve observed operator strengths, identify a testable commercial question, name evidence and articulate what first-party data would settle it. It has **not** produced consistently trustworthy, action-ready intelligence across unfamiliar operators. Continue the research architecture; do not promote its findings into the product Analyzer or call them founder-accepted opportunities yet.

The highest-value next engineering investment is product-scoped evidence and claim provenance, including site-main content, typed booking/contact/price facts and operator-domain identity. A model should reason over those facts, with an independent gate checking its claims and action boundary. More searches or narrower query strings will not solve the false conclusions observed here.

## What we actually observed

| Operator | Live result | Useful intelligence | Boundary or error |
| --- | --- | --- | --- |
| Key West Food Tours | Three-operator run `35940720203`: `PROOF_JUDGED`, 59 records; estimated OpenAI $0.1384 | Recognized strong local visibility, cruise-passenger promise and group-sale logistics; recommended click-testing whether product booking CTAs reach the intended checkout. | This is an investigation, not proof of a broken link or lost revenue. Six provider failures reduced coverage. |
| Moab Jeep / Cliffhanger | Corpus `35940720203`: dossier rejected after one call. Moab-only `35941623261`: reached synthesis with 77 records, then rejected. Estimated $0.0156225 + $0.12379. | Detected a potentially important split between older `moabjeep.net` and newer `cliffhangerjeeprental.com` presence. | Proposed an immediate 301 redirect without a cited detail-page basis or confirmed domain ownership, canonical booking path and traffic. The gate withheld it. The original dossier rejection lacked a saved draft; subsequent code now preserves one. |
| First Lady | Corpus `35940720203`: synthesis rejected. Pilot `35942114346`: 71 records, saved draft; estimated $0.1476945 + $0.14340175. | Correctly preserved CAC cruise price/authority and Lady Grebe positioning; the latest draft selected a cited Priority Boarding/channel-parity investigation, with checkout screenshots and channel data requested before any revenue claim. That draft passes the current validator in offline replay. | Earlier draft falsely implied private-events contact was unclear because the model saw vendor email links and truncated navigation-heavy text. Full source explicitly lists `chartersales@firstlady.com` and a phone number. Typed contact evidence and main-content extraction removed that specific false claim in the next pilot. Latest pilot failed presentation constraints before offline normalization. |

These are model-token **cost estimates**, not independently verified OpenAI billing. The dedicated project has founder-configured prepaid credits, auto recharge off and enforced organization/project spend limits. Paid calls were deliberate pilots/corpus evaluations; local fixtures and replay handled routine development.

## Architecture changes with evidence

- **Acquisition:** the six-page first-party collector now samples across path families, including private events and weddings instead of filling the budget with one cruise category. The Moab case shows the need to resolve related domains and inspect meaningful product pages before acting.
- **Context:** full raw page text stays in private artifacts; a substantive `<main>` excerpt and typed contact emails are presented to the model. Product booking links exclude global navigation and mailto vendor addresses. Untyped page-wide money amounts are withheld from reasoning input; the source still retains them for audit.
- **Judgment:** model findings cite evidence IDs. A next move must anchor one existing finding, match its action type and include the finding's citations. Action-ready opportunities require a cited first-party detail page. Unsupported money amounts, missing IDs and unresolved contradictions fail validation. Measurement-only and uncited presentation items are removed; the capped investigation list retains the next move's cited finding.
- **Diagnostics:** rejected synthesis drafts and, after the Moab corpus failure, rejected business dossiers and initial pages are retained in private artifacts. This makes failures inspectable without assigning Founder a regression task.

## Important limits

The validator checks provenance and structure, but **an evidence ID alone does not prove the wording of a claim**. It did not initially catch First Lady's incorrect sales-contact inference. A typed email and focused source excerpt corrected that specific failure; there is no general semantic guarantee yet. The Key West CTA route requires actual clicks. The Moab domain relationship requires ownership and conversion-path confirmation. SERP rank is discovery evidence, not conversion or margin evidence. Most result sets still have provider failures, and the corpus did not yield three accepted judgments.

The next technical milestone is a product-scoped claim ledger: attach source spans and typed relationships (product, price, booking destination, contact owner, domain identity) to each proposed action. Regress it against the saved private artifacts, then spend credits on one bounded corpus only when offline tests answer a new question. Founder evaluation should judge whether this cautious, source-first reasoning direction is worth integrating later, rather than treating the current recommendations as instructions to the operators.

Canonical implementation history and individual run estimates: [Investigation Lab status](INVESTIGATION_LAB_STATUS.md). Runtime setup and Builder continuity: [Builder bootstrap](BUILDER_BOOTSTRAP.md).
