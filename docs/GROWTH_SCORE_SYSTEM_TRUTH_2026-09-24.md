# Growth Score and dashboard truth checkpoint — September 24, 2026

## Audit

| Surface/system | Existing implementation | Present evidence boundary |
| --- | --- | --- |
| Dashboard preview | Six fallback scores (82/74/61/74/68/76), percentile, trend, bookings/revenue, approvals and synthetic work state. These are preview fixtures, not operator facts. | The default entry now shows a neutral investigation start and no synthetic work state. An explicit `?demo=1` permits inspection of the labeled sample preview. |
| Growth Snapshot | Previously fell back to Blue River Rafting, a 76 score and generated opportunity cards. A prospect profile can carry public findings, but its numeric summary was not a calibrated score. | Now has an empty state without a prospect; prospect findings remain visible while the score and dollar claim are withheld. A matching operator website is required for the Opportunity Brain brief. |
| Growth Score | The retired assessment renderer derived a weighted /100 from legacy pillar values and modeled dollars from detected prices plus assumed visits and yield. | The operator route now always uses an unscored six-system view. With no completed research it displays explicit unknowns instead of rendering the old assessment model. |
| Visibility | Research may support scoped discovery claims; a selected claim alone does not measure all channels or actual traffic. | Unknown until a cited finding carries an explicit Visibility topic. |
| Trust | Public proof may be observed; reputation effect on buying requires more evidence. | Unknown until a cited finding carries an explicit Trust topic. |
| Conversion | Public booking entry may be observed; funnel conversion is unavailable without connected data. | Unknown until a cited finding carries an explicit Conversion topic. |
| Operations | No verified operating-system data in the reduced research result. | Unknown. |
| Intelligence | Research process exists, but source-to-booking attribution is not connected. | Unknown. |
| Growth | A cited primary move and local Mission/outcome record exist. Neither is evidence of company growth health. | Keep system state unknown; show selected priority, scoped Mission state and operator-reported measurement separately without a score or causal claim. |

## Implemented boundary

The researched dashboard now shows all six systems plus priority → Mission → measurement. Its Growth Score route displays a dated six-system read with **Not scored** rather than inheriting the unrelated prospect/review profile's /100 or assumptions. A system gets an observed strength or evidence-backed opportunity only from a cited move with a recognized topic; no headline keyword inference silently maps a claim. Other states are questions or unknown. The score page's old assessment renderer exits for a completed research result. The ordinary preview renderer remains a preview and is not the researched operator view.

The prior claim ledger's `type` meant action state (`QUICK_WIN`, `LEVERAGE`, `INVESTIGATE`), not one of the six systems. Existing archived reads consequently leave Visibility, Trust, Conversion, Operations and Intelligence unknown; only the selected Growth priority and scoped Mission/measurement state are populated. The synthesis contract now asks for a separate `system` topic, passed through the claim ledger and checked during import. A future fresh run can assign a cited claim to a system without turning the topic into a /100 health score. No live model run has tested the new topic output. The dashboard navigation now exposes this unscored view in research mode; the original preview-hide CSS previously hid that link.

The research dashboard bridge previously inferred a pillar from action state (`QUICK_WIN` → Conversion and `LEVERAGE` → Trust). It now uses an explicit supported system topic; older unclassified claims use Growth as a neutral priority bucket rather than making a false system claim.

A selected opportunity does not by itself establish a Growth-system concern. The six-system Growth card stays unknown while the chosen priority remains explicit in its own field. Without completed research, the Growth Score route uses a neutral business label even if an unrelated prospect profile was previously saved in this browser.

The Snapshot's “See what GO can score” handoff now identifies the prospect context. If a completed investigation in browser storage belongs to another website origin, that handoff shows the prospect's six unknown systems and keeps navigation on the Snapshot. A matching operator investigation remains available as a dated, unscored read. The ordinary Growth Score navigation still shows the explicitly saved research read without inferring a prospect context.

The dashboard now accepts a saved investigation only if it has a valid HTTPS operator website, a completed date and source label, a ready action plan, a named business and claim-scoped evidence pages. This also rejects older incomplete browser records rather than falling back to the sample business. The future live Lab response now includes its researched website and completion date; its dashboard handoff runs through the same reduced, evidence-checking importer used for archived files. The hosted Lab page still has no usable authenticated runtime, and this change does not make a live investigation available.

The public Growth Snapshot no longer creates sample opportunities or a numeric score when no prospect has been loaded. A prospect's sourced findings remain readable, but stored score and opportunity-dollar fields do not become visible claims. Its optional Opportunity Brain brief now requires the saved handoff and prospect to share an operator website origin, preventing a previous operator's brain from being rendered for the next business. The dashboard first load hides its static preview cards until the browser resolves the research state. Without research it shows an investigation entry, offers the six-system view, and does not instantiate synthetic work. The separate sample is available only through `?demo=1`, labeled as example data.

This is a scoped public-investigation display. It does not establish durable customer identity, connected business data, causal results or a mathematically calibrated Growth Score. Research import is browser-local. Future product sequencing for reviews, website execution, connected data and public funnel is Founder HQ's decision.

## Verification

The system-truth regression covers cited concern and strength, uncited rejection, unknown systems, Mission baseline/action/follow-up, operator/run isolation and cross-operator Snapshot-to-Score navigation. The dashboard-entry regression covers default empty state, preservation of researched mode, and the explicit demo engine. All 36 local regressions pass. The cloud browser rejected the locally served page with `ERR_BLOCKED_BY_CLIENT`, and no accessible staging URL exists, so visual and interaction browser validation remain a release gate before a founder-facing operator test.
