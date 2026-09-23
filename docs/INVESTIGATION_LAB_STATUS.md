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
