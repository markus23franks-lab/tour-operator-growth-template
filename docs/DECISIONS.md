Decision #001

Growth Operator is a continuous Growth Intelligence Platform, not a one-time optimization service.

Reason

Businesses never stop changing, so Growth Operator continuously monitors, recommends, and improves.Decision #003

The dashboard—not the assessment—is the core product.

The assessment is customer acquisition.

The dashboard is customer retention.## Customer-facing AI language

Atlas remains the internal intelligence layer and is not customer-facing for now.

Customer-facing language should use:
- We found
- We recommend
- Growth Operator recommends
- Our analysis shows

Growth Operator is the relationship. Atlas is the intelligence behind it.## Decision — Analyzer V1 Requires Cold Generalization, Not Perfection
**Date:** August 26, 2026

Growth Operator will not continue indefinitely improving Operator Analyzer before progressing through the broader product.

However, Founder does not want Analyzer abandoned at a point where successful analyses depend heavily on known/tested operators.

Decision:

Before freezing Analyzer V1, GO should demonstrate credible first-run performance across approximately five unfamiliar and diverse operators.

Target acceptance threshold:

Approximately 4/5 analyses should be credible enough to discuss with the operator without operator-specific tuning.

After that threshold:

Analyzer V1 freezes and development moves into Growth Review, Connected Intelligence, Growth Score, Missions, Execution and Measurement.

Analyzer then becomes a continuously improving product subsystem rather than the primary development phase.

Future design-partner data will be used to compare public GO hypotheses against connected business truth and improve Analyzer V1.1.

Rationale:

Attempting to make public Analyzer as knowledgeable as connected Growth Operator would prevent the company from ever progressing beyond Analyzer.

Analyzer is the cold-start brain.

Connected GO is the deeper operating brain.## Decision — Stop Output-Level Analyzer Patching
**Date:** August 31, 2026

Founder and Builder will no longer continue the pattern:

final report looks wrong
→ infer likely cause
→ add heuristic
→ retest same operator
→ repeat.

Build 029 diagnostics demonstrated that Shaggy's first-party operator understanding and inventory extraction can be good while the final market opportunity remains weak.

The next Analyzer investigation must compare the successful Caicos Dream path against the unsuccessful Shaggy's path at the DATA level.

Primary question:

> Does the strongest qualified market evidence actually determine GO's selected opportunity, or is GO selecting a predetermined/generalized opportunity structure and decorating it with evidence?

No further heuristic patch should be made until this is understood.

If opportunity selection/synthesis is structurally weak, repair the decision layer rather than continuing to optimize upstream extraction indefinitely.## Decision — Growth Score Connects Intelligence to Economic Action
**Date: September 1, 2026**

Growth Score is confirmed as a central Growth Operator product system.

It should not function as an arbitrary business grade.

It should summarize GO's current evidence about the operator's growth system and connect that evidence directly to:

CONSTRAINT
→ PRIORITY
→ ACTION
→ ECONOMIC OPPORTUNITY
→ MEASUREMENT

Public evidence may establish an initial score/baseline.

Connected data increases confidence and may change that baseline.

This is expected behavior.

The score should become more accurate as GO learns more about the business.

### Decision — Do Not Artificially Increase ROI Models

A modeled revenue opportunity must remain evidence-backed.

If a current public opportunity appears economically small, GO should not inflate assumptions to make Growth Operator look valuable.

Instead:

- improve the underlying intelligence;
- identify stronger opportunities when evidence supports them;
- connect first-party data;
- establish real traffic/conversion/booking/revenue baselines;
- measure actual outcomes.

The economic model exists to improve trust, not to manufacture urgency.

### Decision — Recover Historical Intelligence Before More Analyzer Patching

Recent Build 031 testing indicates that earlier Caicos Dream Tours analysis produced more tangible and commercially useful external-market intelligence than the current Analyzer.

Before writing additional Analyzer heuristics:

1. Locate the historical successful implementation through Git.
2. Diff it against current Build 031.
3. Identify which useful market/search behaviors were lost.
4. Preserve current evidence integrity and operator-understanding improvements.
5. Merge the strongest elements of both systems.

Do not simply revert the repository.