# Investigation Lab Status
**2026-09-22 — architecture reset implementation**

## Builder 3 verified checkpoint — September 23, 2026

The SerpApi adapter was inspected and exercised locally after the handoff. Duplicate local rows now retain complementary details from the dedicated local response while preserving the embedded result position. An end-to-end regression checks that the enriched phone survives normalization, distinct provider IDs remain an entity investigation, and observed organic presence remains visible even when the local request fails. All 25 local regression scripts passed at this checkpoint. This is fixture evidence, not a live-provider finding.

The next consequential proof is a live multi-operator corpus run of the backend Investigation Lab, with captured evidence, provider status, model usage and human review of whether the findings changed the commercial investigation. The local environment has no `OPENAI_API_KEY` or `SERPAPI_KEY`, so it cannot establish provider recall, entity-detail accuracy, model judgment quality, latency or cost on live operators. The frontend should not be migrated to this proof engine on fixture results alone.

`scripts/investigation-corpus.mjs` runs 1–10 unfamiliar operator URLs against a configured Lab endpoint, records per-operator state/latency/coverage/provider failures and saves the complete returned evidence and judgment after each run. This makes the live evaluation reproducible without asking the founder to run the same analysis manually. The runner does not confer product acceptance: Builder must inspect the captured evidence and findings, diagnose failures, and only then present a materially better operator experience for founder judgment. The Lab response currently exposes model usage but does not yet report provider dollar cost. The corpus runner cannot exercise live research until a configured runtime is accessible.

The current proof is synchronous. Credential-consuming actions require a server-side `GO_LAB_TOKEN`, and the corpus runner supplies that token through its own environment. Do not connect this proof to the customer-facing Analyzer until budget controls, durable jobs, appropriate operator authorization and runtime limits are addressed. The current shared lab token is for internal evaluation, not customer authentication.

Runtime correction: `scripts/investigation-corpus.mjs local` now invokes this same handler directly with an ephemeral per-run token. This supports a private GitHub Actions evaluation workspace without a deployed Netlify site or a persistent Lab token. See `RESEARCH_EVALUATION_RUNTIME.md` for the rationale, security boundary and unfinished setup. The HTTP runner path remains available for a later configured service.

First private live run 35909341415 reached the OpenAI API but all three operators returned `You have no credits remaining`; it produced no intelligence evidence. The corpus runner now fails the workflow when any investigation fails, while preserving its artifact. OpenAI API credits are the current access blocker; see `RESEARCH_EVALUATION_RUNTIME.md` for exact run and rerun steps.

Pre-funding economics checkpoint: `gpt-5` is the current default, at three model stages plus a fourth synthesis when coverage is ready. The research adapter now bounds serialized input/output, and the corpus artifact records per-stage token usage and estimated GPT-5 charges even when later validation fails. No successful live run exists, so per-operator cost and judgment quality remain unmeasured. Normal Builder development does not run the paid corpus; the first funded validation must use an explicitly enforced project spend limit and a deliberately triggered small corpus.

## Current proof pipeline

The backend proof now executes this architecture:

```
URL
→ rendered first-party acquisition when Firecrawl is configured
  → direct HTML fallback
→ normalized first-party evidence
→ model-built Business Dossier
→ model-built initial Investigation Plan
→ independent Organic + Local/Maps collection per commercial query
→ normalized cross-surface evidence
→ operator/entity reconciliation
→ anomaly detection
→ model-built follow-up plan from evidence
→ second-pass research for novel supported questions
→ final cross-surface reconciliation
→ model commercial synthesis
→ deterministic truth validation
```

The customer-facing Analyzer has intentionally not been rewired yet.

## What is materially different from Build 055

1. The model is now responsible for semantic business understanding and research planning.
2. Search/local providers are acquisition tools rather than the source of GO's judgment.
3. Organic and local surfaces are queried independently and reconciled.
4. Multiple local provider entity IDs can create a `POSSIBLE_ENTITY_FRAGMENTATION` investigation rather than a fabricated defect.
5. Observed presence on any reconciled surface becomes presence evidence; an UNKNOWN surface cannot erase it.
6. Evidence can create a second research pass. The research plan is no longer necessarily one-shot.
7. Final commercial judgment is model-generated but must cite normalized evidence and pass deterministic truth gates.
8. Rendered website/screenshot acquisition has a provider path (Firecrawl) with direct HTML fallback.

## Current external configuration needed for a live proof

- `OPENAI_API_KEY`
- `SERPAPI_KEY`
- `GO_LAB_TOKEN` (internal proof access)
- optional `FIRECRAWL_API_KEY`
- optional `GO_RESEARCH_MODEL`
- optional `GO_SYNTHESIS_MODEL`

No secret should be committed to the repository.

## Current limitations before founder test

- Competitor-site follow-up is not yet executed by the adaptive loop.
- Review/reputation provider evidence is not yet first-class in the Lab.
- Screenshot/vision evidence is acquired when Firecrawl is configured but not yet analyzed as a bounded visual evidence stage.
- Local entity reconciliation is intentionally conservative and needs live-provider evaluation.
- Persistence/background jobs are not yet implemented; the proof is synchronous.
- Cost/latency telemetry captures model usage but not provider dollar cost yet.
- The Lab has not yet been run live across the proof corpus from this branch because runtime secrets are not available inside GitHub CI.

## Current engineering signal

CI #238 is green after adding:
- evidence truth contract
- cross-surface reconciliation
- independent organic/local adapter
- model evidence binding
- adaptive follow-up research
- commercial synthesis validation
- rendered first-party acquisition

Green CI means the architecture contracts behave as designed against fixtures. It does **not** mean the new intelligence is founder-accepted.

## Next autonomous work

Continue adding high-value evidence capabilities and fixture/eval infrastructure that do not require secrets. The next live milestone is a corpus run of the Investigation Lab, not another Build 055 Analyzer test.

Founder should not be asked to test until the Lab demonstrates materially better intelligence on live evidence.

## September 23 funded corpus checkpoint (unaccepted)

Private research run `35917523287`, pinned to public GO commit `634c4bb0e2b4955da1dcbe28676b6166063e3627`, reached the GO Research API successfully. Key West Food Tours and Moab Jeep each returned HTTP 502: their initial investigation plan consumed all 6,000 output tokens, including 4,736 reasoning tokens, leaving incomplete JSON. First Lady returned `NEEDS_MORE_EVIDENCE`: six observed first-party records, a detailed dossier and commercially interesting research questions, but **zero** organic/local/competitor evidence and no commercial judgment. This is neither a successful intelligence evaluation nor founder-ready output. The private artifact is attached to the run and expires September 30.

Nine successful model responses consumed an estimated **$0.4102** based on recorded tokens and the GPT-5 standard price assumption; actual billing should be checked against the OpenAI project Usage page. The runner mistakenly reported unknown cost because OpenAI reported `gpt-5-2025-08-07` rather than the alias `gpt-5`. The corpus proved that reasoning tokens count toward the output ceiling and cost. The 6,000-token limit remains; calls now request low reasoning effort, plans ask for at most three concise questions with two seed queries each, and parsing errors report response status/incomplete reason. Corpus pricing recognizes dated GPT-5 IDs and missing usage stays unknown. `NEEDS_MORE_EVIDENCE` responses now include query and provider status diagnostics, which were missing from this run, so the cause of First Lady's zero market records is **not yet known**. These changes need regression and a limited live validation before another full corpus.

The subsequent single-site First Lady pilot `35918818125` completed its model plan in three calls for an estimated **$0.07892025**, but every one of five searches failed: SerpApi rejected the dossier's free-form `Chicago, IL, USA` location for both organic and local engines. GO correctly withheld a commercial judgment; the green job is a successful *diagnostic*, not successful intelligence. SerpApi's free supported-locations endpoint supplies canonical city names. The adapter now resolves city plus region to a supported canonical value, fails closed when location is ambiguous, and reuses a resolved value across search queries. This is a provider-compatibility fix, not a city-specific product rule. The local adapter regression covers abbreviated states and independent organic/local collection. A targeted live search validation remains necessary before reattempting the corpus. Estimated model totals across funded corpus and pilot are **$0.4891**; this is not verified billing or SerpApi cost.

Search-only probe `35920399190` verified canonical location `Chicago,Illinois,United States` and returned three local entities without model calls. Organic search exceeded the adapter's 9-second ceiling; local and organic outcomes remained independent and the probe failed as intended. The default provider deadline is now 20 seconds. The private workflow can run a `[GO provider]` issue without OpenAI and posts its own Actions run URL to the issue. An earlier workflow edit accidentally introduced invalid YAML in an inline shell command; it was repaired using a block scalar and validated before the successful provider probe. The extended timeout still needs a second provider-only run.

Probe `35920527137` then returned 9 organic results and 3 local entities with no provider errors. First Lady model pilots `35920584532`, `35921095188`, `35922550621`, and `35928313600` acquired market data and completed the dossier and both planning calls, but the final synthesis call was not sent: its input exceeded the 100,000-character ceiling. Shrinking each observation from 8,000 to 2,500 and then 1,000 characters did not solve this because hundreds of market records and duplicated full records in the signals made aggregate input unbounded. These pilots cost approximately $0.0806, $0.1148, $0.1008, and $0.0915 respectively from recorded model tokens; all are estimates pending billing reconciliation. No commercial judgment has yet been obtained. Avoid another paid corpus until the selection gate passes offline.

Synthesis now uses a deterministic selection capped at 48 records, retaining first-party pages, up to three records per query and surface (target-presence first, then rank), plus competitor site records. It projects signals to concise summaries rather than embedding full evidence records again. The full acquired evidence remains in the private response artifact on successful runs. A synthetic 207-record regression including oversized raw signals verifies a bounded input, organic and local coverage, target presence, competitor site retention, and total record count. The model is warned that omitted evidence is not proof of absence; final citations are validated against the exact records shown to the model. This is an architectural selection boundary, not another per-record truncation. It still requires one bounded live validation to establish product judgment quality.

Single-site run `35938100802` proved the synthesis boundary works: its fourth model call received 15,011 input tokens and returned a draft; total estimated OpenAI usage was $0.1297. It failed deterministic validation because three `INVESTIGATE` findings appeared in the `opportunities` array. Such findings now move to `investigations` before validation, while action-ready opportunities remain in their original bucket. If any subsequent draft fails validation, the private artifact preserves the draft and full acquired evidence for review. A green run still requires manual Builder inspection of individual claims, citations and economic boundaries before founder evaluation.

Run `35938490930` (private issue #12) returned `PROOF_JUDGED` for First Lady with 115 evidence records, four model calls and estimated model cost **$0.132451**. This is **not founder-accepted**. Inspection found a specific false price contradiction: a first-party page mentioned a `$1,000` charitable donation, but both acquisition paths extracted the prefix `$1` into their generic `prices` list. The model then asserted a `$12` versus `$1` dog-fee conflict. It also recommended publishing supposedly missing tour prices without sufficient product-specific confirmation; the cited Canine page already advertises a starting ticket price. Other findings speculate about conversion and customer confusion without booking or customer data. The green workflow means the schema and previous validators passed, not that its commercial claims were correct.

The price extractor now preserves comma-separated thousands; the monetary validator grounds amounts in cited source text instead of the lossy generic `prices` list. The actual run #12 judgment now fails validation with `next move cites unsupported $1 amount`, and both rendered and direct-fetch regressions cover the `$1,000` case. This catches the observed numeric failure but does not prove that a dollar amount refers to the correct product or that a missing-price claim is true. Further claim-level product/context checks and review of the same artifact are needed before another deliberate paid pilot. These costs are estimates from response usage, not verified billing.

Next-move provenance is now structural: the synthesis schema requires `findingHeadline` to name one existing finding. Its type must match that finding and its citations must include that finding's evidence. Run #12's quick-win next move cannot pass this contract because it spliced together two tentative investigations. The model instructions also treat a price-free listing/snippet as insufficient proof of a price-free product page, and disallow treating an extracted page-wide amount as a product-specific fee. All local regression scripts pass after this change. This remains an offline gate; no new paid run has validated the new schema yet.

Bounded First Lady pilot `35939338749` on public commit `8b377a6675f63d7c151d5a6d8af4223914b4ee8c` returned `PROOF_JUDGED` with 113 evidence records and four model calls estimated at **$0.14664875**. The new next-move anchor worked: a single index-page Buy Tickets CTA opportunity is linked to the next move; the `$1` dog-fee invention is absent. This is still **not founder-ready**. A separate `VALIDATED_OPPORTUNITY` asserts a phone-only, under-packaged private-events sales path from homepage evidence alone; GO had not fetched the private-events detail page. The model also inferred that page-wide ancillary amounts were unexplained fees even though they included a charity donation, and suggested a price absence investigation despite a Canine search snippet showing a starting fare. These are semantic evidence failures, not schema failures.

To prevent this class of premature product action, action-ready findings now require a cited observed first-party detail page; a homepage or search snippet alone cannot validate a specific product change. A regression checks homepage rejection and detail-page acceptance, and replay of pilot #13 now rejects its private-events opportunity. Reasoning-stage input omits the untyped page-wide `prices` list while preserving it in raw evidence artifacts, because the list can mix donation, parking and ticket values. Local regression scripts pass. This more conservative gate may withhold genuine homepage-only fixes; improving targeted first-party acquisition and product-scoped evidence is the next architectural work before a wider paid corpus. Actual OpenAI billing has not been independently verified; all dollar values here derive from token telemetry.

The direct first-party collector previously favored the first five high-scoring navigation links. Its ranker also failed to recognize `private events` or `weddings` as operator offerings, which explains why the First Lady acquisition selected only cruise pages. A bounded, generic diversity pass now samples across top-level path families before taking additional links from the same family, and the ranker recognizes private/group events and weddings. It still reads at most six first-party pages. A synthetic multi-product navigation fixture verifies that cruise depth does not displace private events and weddings. The behavior on live pages and its downstream model cost/quality remain unvalidated; no additional OpenAI run has been triggered for this change.

Pilot `35940051881`, pinned to `bb62f6b9bd0db240973e0afa5a9a310f41ee431a`, confirmed acquisition of actual First Lady private-events and weddings detail pages alongside Architecture and Lady Grebe pages (the /cruises index was omitted by the six-page budget). It acquired 89 evidence records and made four model calls for estimated **$0.1547925**, but returned HTTP 502: the model placed a `MEASURE` review-recency finding in the action-ready `opportunities` bucket. The private artifact preserved the draft and all evidence. Offline replay drops this measurement-only item from action-ready opportunities and passes the remaining draft through the full validator. The draft does **not** repeat the unproven phone-only private-events gap; instead it recognizes published private-events, wedding and Lady Grebe prices and recommends investigating the cross-domain Architecture booking journey, with explicit analytics and buyer research needed before claiming leakage. This is a material improvement in judgment but only one operator and still a draft, not founder acceptance. The MEASURE normalization is covered by a regression and needs one full-corpus validation. It should not be interpreted as observed conversion loss.

Three-operator corpus `35940720203`, pinned to `2faf92d85700936f6771a7cc00bbb190eceadab0`, is **not accepted**. Key West Food Tours reached `PROOF_JUDGED` with 59 records and six provider failures, estimated model cost **$0.1384**; its useful next move is an explicitly investigative click-test of product booking CTAs, not a claimed verified misroute. Moab Jeep stopped after the dossier call (**$0.0156225** estimated) because a modeled product name failed first-party text grounding; the old error path discarded the draft and acquired pages, so the exact false product cannot be diagnosed from this artifact. First Lady acquired 142 records and failed synthesis validation (**$0.1476945** estimated): a proposed Chicago By Night pricing quick win cited only a SERP result and homepage, and the draft exceeded the three-investigation presentation limit. Its next investigation also claimed Private Events/Weddings lacked a clear sales contact because the compact evidence exposed incidental vendor `bookings@` mailto links, while the full first-party Private Events page explicitly said to email `chartersales@firstlady.com` and listed a phone number. The gate correctly withheld the quick win but did not detect that semantic contact error. Corpus model estimate totals **$0.301717**; actual billing remains unverified.

The first-party adapter now records `contactEmails` separately and excludes mailto URLs from `bookingLinks`; the model receives up to 1,500 characters of each first-party detail page (previously 500) and typed contact emails, still within the 90,000-character synthesis input gate. A regression reproduces an operator sales email plus incidental vendor email. Early dossier failures now retain the rejected `draftDossier` and initial first-party records in the private artifact, like late synthesis failures. This is an evidence-presentation/diagnostic correction; it needs live evaluation before any founder judgment. A page-wide link list or truncated text is not proof that an operator lacks a sales contact.

Private evaluation has a repeatable `[GO moab]` issue route using `moab-corpus.json`, alongside `[GO pilot]` (First Lady) and `[GO research]` (all three). Moab-only run `35941623261`, pinned to `9d1addc6d6ea0b54a959d1b907bce149aa6b0e40`, passed dossier and investigation on this attempt, acquired 77 evidence records and four model calls estimated **$0.12379**. Its draft identified the older `moabjeep.net` site and a newer `cliffhangerjeeprental.com` booking presence, then proposed an immediate 301 redirect. Validation withheld the quick win because its cited first-party evidence on the older domain was homepage-only. Ownership of both domains, the actual canonical conversion path and redirect consequences remain unverified; this is an **investigation hypothesis**, not an operator action. The earlier corpus dossier failure appears sensitive to model output; its exact rejected product remains unknown because it predated draft retention. This run's preserved artifact provides a separate site/evidence baseline but does not reproduce that early failure. Do not treat a second attempt passing as proof of dossier reliability.

Current acceptance signal: one of three operators returned a judged but tentative investigation, while two were appropriately withheld by grounding gates; the Moab repeat was also withheld. The model architecture has produced useful unfamiliar-operator questions, but it has **not** established consistently exceptional, action-ready commercial intelligence. Next work should improve product-scoped source context, cross-domain operator identity, and deterministic claim grounding; avoid interpreting a green workflow or syntactically valid draft as founder acceptance. Further paid calls should target a concrete architectural hypothesis, not become the normal development loop.

First-party HTML evidence now retains full `text` for audit and also extracts `mainText` from a substantive `<main>` element. Reasoning stages use that main content first, so a 1,500-character selection does not spend its entire budget on repeated site navigation. When `<main>` exists, `bookingLinks` are scoped to that content rather than global header gift-card or unrelated product links. If the element is absent or too thin, model text falls back to full page text. The typed `contactEmails` continue to come from the full page. A local fixture verifies distinct raw/main text, charter contact visibility and exclusion of a global gift-card link; all regression scripts pass. This is not yet validated on live sites. A missing link in the sampled main content is not proof that a booking path does not exist; absent/misrouted link claims still require a click-path check.

First Lady pilot `35942114346`, pinned to `c8ad8579a6f6d786105aba56dfda09509729eff5`, acquired 71 records, four model calls, estimated **$0.14340175**, and preserved a rejected draft. Live evidence confirms main content begins with the product, not repeated navigation, and `chartersales@firstlady.com` is typed on the Private Events page. The former false sales-contact claim is absent. The draft highlights CAC cruise price/authority and Lady Grebe inclusions, and selects an INVESTIGATE next move about Priority Boarding parity requiring checkout screenshots and conversion data. It failed only presentation constraints: a `MEASURE` item appeared in investigations, an uncited deprioritization appeared, and investigations numbered four. Offline normalization now drops measurement-only and uncited items, caps investigations at three while retaining the cited next move, and the saved draft passes the entire commercial validator. All local regression scripts pass. This is an offline replay of a live draft, **not** a green rerun or proof of conversion impact. No additional paid call should be made merely to prove the formatting cleanup.

## September 24 source-to-claim checkpoint (requires bounded live validation)

Commercial findings now include `supportQuotes`: short exact passages paired with their cited evidence IDs. A malformed quote, a quote from an uncited row, or more than four quote anchors fails validation. An action-ready opportunity requires a verified verbatim passage from an observed first-party detail page; a page ID alone no longer satisfies the action gate. The model instructions ask for concise exact passages and tell it to leave uncertain or absent product claims as investigations. The validator runs against the exact bounded evidence projection supplied to the model, not the full page stored in the private artifact. This prevents unseen text from retroactively legitimizing a claim. Local regressions cover a valid detail-page quote, a paraphrase, a borrowed uncited quote and a passage omitted from the model's 1,500-character view; all regression scripts pass. Exact quotation establishes source provenance, **not** that the proposed business interpretation follows from the quote. A first live single-operator pilot must test whether GPT-5 can reliably supply these anchors and whether the resulting judgments are actually more sound before a three-operator corpus or product integration.

Pilot `35949414662`, pinned to `f173f12014e108a8be544289de7398495c1f91eb`, could not test the quote contract: SerpApi returned `Your account has run out of searches` on **all 16 organic/local requests**. GO correctly returned `NEEDS_MORE_EVIDENCE`, six first-party records and no commercial judgment. Three planning/model calls cost an estimated **$0.07800075**. Treat provider quota exhaustion as a hard live-research blocker; do not retry search or ask Founder to run a regression. The OpenAI prepaid budget and SerpApi search quota are separate.

To evaluate the new synthesis schema without additional SerpApi searches, `scripts/replay-commercial-synthesis.mjs` now reads an archived private `READY_FOR_JUDGMENT` corpus and performs **one** synthesis call. A dry-run mode checks selection size without any API key or charge; a separate `GO_ALLOW_PAID_SYNTHESIS=1` flag and `OPENAI_API_KEY` are required for paid replay. The private `[GO replay]` workflow downloads the saved First Lady artifact from run `35939338749` and uploads a private replay judgment/usage artifact. The fixed archived evidence is historical and expires October 1; a passing replay does not establish current market facts. Local dry-run selected 48 of 113 records and 63,612 input characters. A regression verifies the explicit paid-use gate. This replay path is unvalidated in Actions until its first bounded run.

The quote replay refinement now records two outcomes separately: `normalizedQuotes` for terminal-ellipsis cleanup where the prefix is exact, and `discardedQuotes` for unsupported wording. The offline replay of run `35939338749` previously found one real typo-like quote (`th e`) and two search-result title quotes that were not present in the model-visible snippets; these are retained in the rejected artifact rather than silently accepted. This is provenance hygiene, not semantic proof. The next live-synthesis interpretation should inspect the remaining claims and quote context, not just the validator result.
