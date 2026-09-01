# Company operating plan schema

## Evidence states

- `confirmed`: approved enterprise fact; may drive a target or decision.
- `candidate`: extracted, collected, or inferred information awaiting human confirmation.
- `missing`: required information not yet supplied.
- `conflicting`: two or more active sources disagree.

## Eight dimensions

| ID | Dimension | Required focus |
| --- | --- | --- |
| strategy | Strategy and stage goals | stage, positioning, priorities, non-goals |
| product | Product and service | portfolio, pricing, value, lifecycle |
| market | Market, brand, and acquisition | segments, channels, brand, acquisition efficiency |
| sales | Sales, customer, and revenue | pipeline, conversion, retention, revenue quality |
| delivery | Delivery, service, and operations | capacity, quality, service level, efficiency |
| organization | Organization, talent, and execution | ownership, skills, incentives, collaboration |
| finance | Finance, budget, and allocation | cash, margin, budget, investment constraints |
| risk | Risk, compliance, and digitalization | legal, policy, operational resilience, systems |

## Plan object

```text
plan: id, period, version, status, generated_at, approved_at, reviewer
evidence: source_id, state, owner, effective_date, confidence
priority: outcome, metric, target, rationale, trade_off
dimension: id, current_state, outcome, initiatives, status
initiative: metric, baseline, target, owner, deadline, resources, dependencies, risks, evidence_ids
review: cadence, target, actual, variance, cause, corrective_action, conclusion_type
```

## Validation gates

- Require exactly eight dimension records, even when some are gaps.
- Limit company priorities to three.
- Reject targets without an owner, deadline, metric, or evidence/gap marker.
- Reject candidate evidence used as a confirmed fact.
- Flag resource demand above available cash, people, capacity, or time.
- Keep status at `draft_review` until a named reviewer confirms conflicts and high-risk commitments.
- Preserve the approved version; create a new version for later changes.
