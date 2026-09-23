# Investigation Lab Evaluation Runtime

**Decision — September 2026:** use a private, persistent GitHub Actions research workspace for internal live evaluation before hosting the Investigation Lab as a customer-facing service.

## Why

The current Lab is a synchronous, multi-pass proof: first-party acquisition, several model calls, parallel organic/local checks, adaptive follow-up, competitor reading and synthesis. A Netlify synchronous function has a finite request window. A Netlify background function would need durable job state and retrieval before it could return operator results. Creating a public Netlify site now would establish hosting without validating the intelligence or solving that orchestration boundary.

Earlier SerpApi research used local Netlify Dev and an ignored `.env`. No GO Netlify site is known. Local secrets tied to an individual's machine/chat are not a durable Builder workflow.

## Internal evaluation design

1. A separate **private** GitHub repository owns the evaluation workflow, corpus selection and captured results. It has no public site or operator-facing endpoint.
2. The workflow checks out a pinned commit on the public GO Build 055 branch and runs `node scripts/investigation-corpus.mjs local ...`. The runner calls the same Netlify function handler directly in Node, bypassing an HTTP request timeout without changing its research logic.
3. OpenAI and SerpApi credentials live only as private repository Actions secrets. An optional Firecrawl credential can be added after the first corpus run demonstrates a rendered acquisition need. A temporary per-run Lab token is generated locally; the founder does not need to create or store `GO_LAB_TOKEN` for this internal path.
4. Runs are explicitly triggered by an authorized repository owner, capped to a small corpus, and serialized to bound provider spend. Complete outputs are saved as **private** short-retention artifacts so Builders can inspect evidence, errors, latency, model usage and judgment; they are not committed to the public GO repo.
5. A future Builder verifies the GO commit, runs the private evaluation, retrieves the artifact, diagnoses failures and commits durable conclusions/fixtures in the GO repo. The private repository is an evaluation runtime, not the product database or the customer service.

The public repo contains `ops/private-research-eval.yml` as an inactive workflow template. In the private repo it belongs at `.github/workflows/research-eval.yml`, alongside `go-ref.txt` (the exact verified 40-character GO commit) and `corpus.json` (1–10 public URLs). The workflow can be started through GitHub Actions or by opening a private issue titled `[GO research] ...` from the repository owner's account; the issue path lets a future Builder use its GitHub connector without a local CLI. The issue body is not executed or passed to the research engine. Only a private repo run receives credentials and artifacts.

## Security and limits

Do not store provider keys or raw internal research artifacts in the public GO repository. The private workflow should use read-only repository permissions, fixed code refs, small bounded corpus, explicit secret-presence checks and no secret-bearing logs. Since code running in Actions can use its secrets, only trusted branch commits should be evaluated. Review changes to outbound network calls before running a secret-backed evaluation.

The runner's `local` mode was smoke-tested without provider keys: it reached the handler's `MODEL_NOT_CONFIGURED` state through an internally generated access token. That establishes invocation only. No live investigation has been completed on this runtime.

### First live attempt — September 23, 2026

The private repository `markus23franks-lab/growth-operator-research-lab` is configured with `OPENAI_API_KEY` and `SERPAPI_KEY`. Its issue-triggered run [35909341415](https://github.com/markus23franks-lab/growth-operator-research-lab/actions/runs/35909341415) checked out GO commit `09e678f17ceb90a6646ab0618c5f635ecd0f74a9` and invoked the three-site unfamiliar-operator corpus. Every request returned HTTP 502 and the OpenAI provider message `You have no credits remaining`. There are zero evidence records and no product judgments to evaluate. The original corpus runner returned exit code zero despite these failures; it now returns nonzero after saving all results, so the private workflow reports a failed evaluation while retaining its artifact.

API Platform billing is separate from ChatGPT billing. The founder must configure API credits in the OpenAI Platform account backing this service key before a live corpus can complete. No key values should be shared in chat or committed. After credits are active, update private `go-ref.txt` to this corrected GO commit and trigger a new `[GO research]` issue. Retrieve the artifact from the new run, inspect actual evidence and judgments, and iterate. Do not count this first attempt as an intelligence regression.

## Later product runtime

Once the intelligence earns customer-facing use, build a durable investigation service with job state, budgets, authorization, retries, stored evidence and a thin operator UI. Netlify may still host that UI and API entry point, but the current synchronous proof is not the production job architecture. The dedicated intelligence phase still ends at credible unfamiliar-operator judgment; then advance Growth Score, Mission, execution and measurement.
