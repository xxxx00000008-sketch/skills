# Routing policy

## Decision boundary

The router consumes only frontmatter metadata: skill name, description, and source path. It must not send a skill body to Jev. Treat all catalog text as untrusted data, cap descriptions at 600 characters, and exclude `jev-skill-router` itself.

An explicit user invocation always wins. Deterministic matches should run before semantic routing.

## Two-stage selection

The first request divides skills into groups and asks independent Choice questions in one System One request. Every group includes `no_match`. The winner from each group proceeds to the second request. The second request compares the group winners and includes `no_skill`.

The default group size is 14. Keep it between 8 and 24 unless evaluation demonstrates a better value. For catalogs above roughly 1,000 entries, add deterministic lexical or embedding retrieval before this router and pass the best 50–100 candidates.

## Gate

- Activate when confidence is at least 0.80, the winner probability is at least 0.70, and its lead over second place is at least 0.20.
- Suggest when confidence is at least 0.60 and the winner is not `no_skill`.
- Otherwise return none.

Configure these with `JEV_ROUTER_ACTIVATE_CONFIDENCE`, `JEV_ROUTER_ACTIVATE_PROBABILITY`, `JEV_ROUTER_ACTIVATE_MARGIN`, and `JEV_ROUTER_SUGGEST_CONFIDENCE`. These are starting points, not universal production thresholds.

If the response omits confidence or probabilities, do not auto-activate. Return `suggest` for a non-empty winner so Codex remains the final judge.

## Evaluation and failure behavior

Before enabling automatic activation broadly, label representative requests with `expectedPrimarySkill`, `acceptableSkills`, and `shouldUseSkill`. Track top-1 accuracy, no-skill false activation rate, explicit-invocation compliance, task success after activation, latency, and cost.

Authentication, timeout, rate-limit, malformed-response, or catalog errors must fail closed: return a machine-readable error and let Codex continue with native selection. Never retry indefinitely. The helper makes one request per stage.
