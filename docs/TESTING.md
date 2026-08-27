# Growth Operator Intelligence Regression Suite

## Purpose

Operator Analyzer should be evaluated on generalized behavior rather than whether one known demo operator produces a good result.

Regression operators represent different reasoning challenges.

## Current Core Regression Set

### Cayman Ocean Adventures

Tests:
- water/boat inventory
- commercially relevant demand prioritization
- representative search portfolio
- avoiding overly generic destination demand

### Five Star Adventures Tours

Tests:
- sightseeing/celebrity-tour inventory
- avoiding demand simply because evidence is easy to retrieve
- FareHarbor detection
- commercially sensible search selection

### Tropical AD

Tests:
- multi-segment inventory
- land vs sea products
- primary products vs included components
- Junglebee/direct booking classification
- representative coverage across meaningful business segments

### Caicos Dream Tours

Tests:
- larger operator/inventory
- strong generalized public investigation
- commercially relevant search generation
- useful visibility findings

Caicos represents one of the strongest recent examples of desired cold-start Analyzer behavior.

### River Ranch

Tests:
- unusual/nontraditional tour operator
- geography vs activity-language separation
- operator understanding outside common water/sightseeing patterns
- booking-stack detection

### Shaggy's Diving

Tests:
- diving-specific commercial inventory
- preservation of operator truth into market demand
- Peek detection
- state isolation
- prevention of generic destination demand replacing specific commercial inventory

## Hard Regression Failures

The following should fail a test regardless of presentation quality:

- fabricated evidence
- wrong operator identity
- materially incorrect geography
- stale data from another operator
- marketplace falsely identified as direct OBP
- irrelevant entity treated as competitor
- major confirmed inventory replaced by generic demand
- confident conclusion unsupported by collected evidence

## Testing Philosophy

Do not optimize regression operators until every result is perfect.

Regression tests exist to detect architecture breakage.

Cold unfamiliar operators remain the primary test of generalization.