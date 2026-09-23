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

## Later product runtime

Once the intelligence earns customer-facing use, build a durable investigation service with job state, budgets, authorization, retries, stored evidence and a thin operator UI. Netlify may still host that UI and API entry point, but the current synchronous proof is not the production job architecture. The dedicated intelligence phase still ends at credible unfamiliar-operator judgment; then advance Growth Score, Mission, execution and measurement.
