# Growth Score and dashboard truth checkpoint — September 24, 2026

## Audit

| Surface/system | Existing implementation | Present evidence boundary |
| --- | --- | --- |
| Dashboard preview | Six fallback scores (82/74/61/74/68/76), percentile, trend, bookings/revenue, approvals and synthetic work state. These are preview fixtures, not operator facts. | Research mode already hid most preview sections; its sidebar also hid the Growth Score route. |
| Growth Snapshot | Falls back to Blue River Rafting, a 76 score and generated opportunity cards. A prospect profile can carry public findings, but the fallback and numeric summary are not a claim-ledger score. | Hidden from research dashboard. It must not be presented as a researched Snapshot. |
| Growth Score | Assessment derives a weighted overall /100 from legacy pillar values and can model dollars from detected prices plus assumed visits and yield. It can convert a summary's keywords into purported observed signals. | These are not a defensible current score or operator-specific economics. |
| Visibility | Research may support scoped discovery claims; a selected claim alone does not measure all channels or actual traffic. | Cited, explicitly typed discovery claim can show concern/strength; otherwise unknown. |
| Trust | Public proof may be observed; reputation effect on buying requires more evidence. | Cited, explicitly typed trust claim can show concern/strength; otherwise unknown. |
| Conversion | Public booking entry may be observed; funnel conversion is unavailable without connected data. | Cited, explicitly typed conversion claim can show concern/strength; otherwise unknown. |
| Operations | No verified operating-system data in the reduced research result. | Unknown. |
| Intelligence | Research process exists, but source-to-booking attribution is not connected. | Unknown. |
| Growth | A cited primary move and local Mission/outcome record exist. Neither is a company health score. | Show selected priority, scoped Mission state and operator-reported measurement state without score or causal claim. |

## Implemented boundary

The researched dashboard now shows all six systems plus priority → Mission → measurement. Its Growth Score route displays a dated six-system read with **Not scored** rather than inheriting the unrelated prospect/review profile's /100 or assumptions. A system gets an observed strength or evidence-backed opportunity only from a cited move with a recognized topic; no headline keyword inference silently maps a claim. Other states are questions or unknown. The score page's old assessment renderer exits for a completed research result. The ordinary preview renderer remains a preview and is not the researched operator view.

This is a scoped public-investigation display. It does not establish durable customer identity, connected business data, causal results or a mathematically calibrated Growth Score. Research import is browser-local. Future product sequencing for reviews, website execution, connected data and public funnel is Founder HQ's decision.

## Verification

The system-truth regression covers cited concern and strength, uncited rejection, unknown systems, Mission baseline/action/follow-up, and operator/run isolation. Local regressions pass. The cloud browser rejected the locally served page with `ERR_BLOCKED_BY_CLIENT`, and no accessible staging URL exists, so visual and interaction browser validation remain a release gate before a founder-facing operator test.
