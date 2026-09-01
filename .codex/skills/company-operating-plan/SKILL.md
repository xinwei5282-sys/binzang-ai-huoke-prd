---
name: company-operating-plan
description: Generate, review, and iterate a company-wide operating plan from confirmed enterprise facts, diagnosis, external intelligence, goals, finances, organization, and operating data. Use when creating or revising annual, quarterly, or monthly company plans, cross-functional priorities, resource allocation, operating reviews, or executive action plans; treat marketing and customer acquisition as one dimension rather than the whole plan.
---

# Company Operating Plan

Generate an auditable company-level plan that connects strategy, resources, execution, and review. Keep every claim traceable to confirmed evidence.

## Build the evidence base

1. Collect confirmed enterprise profile, diagnosis, goals, financial constraints, organization capacity, operating history, and approved industry, policy, and competitor intelligence.
2. Separate evidence into `confirmed`, `candidate`, `missing`, and `conflicting` states.
3. Use only `confirmed` evidence as company facts. List candidate or missing items as review questions; never silently complete them.
4. Record source, owner, effective date, and confidence for material assumptions.

## Generate the plan

1. Define the planning period, operating stage, and company-level outcome.
2. Select at most three company priorities. Make trade-offs explicit.
3. Cover all eight dimensions in `references/plan-schema.md`. Mark a dimension as `gap` when evidence is insufficient instead of inventing targets.
4. For every initiative, specify outcome, metric, baseline or gap, target, owner, deadline, resources, dependencies, risks, and evidence.
5. Run conflict checks across cash, people, capacity, timing, and cross-department dependencies.
6. Keep customer acquisition inside “market, brand, and acquisition”; do not use it as the plan backbone.

## Gate activation

1. Output the first version as `draft_review`.
2. Present fact gaps, conflicting assumptions, resource conflicts, high-risk commitments, and decisions requiring management approval.
3. Do not activate the plan or dispatch departmental tasks until an authorized reviewer approves it.
4. After approval, freeze the approved version as `active`; preserve revisions and reviewer history.

## Close the operating loop

1. Review leading indicators monthly and company outcomes quarterly.
2. Compare target, actual result, variance, cause, and corrective action.
3. Label conclusions as fact, inference, or hypothesis.
4. Feed approved review conclusions into the enterprise brain and generate the next version without overwriting prior evidence.

## Deliverables

Produce, in order:

1. Plan overview and evidence coverage
2. Three company priorities
3. Eight-dimension operating plan
4. Resource and dependency map
5. Risk and information-gap register
6. Human review checklist
7. Review cadence and version record

Load `references/plan-schema.md` for the field schema, dimension definitions, and validation gates.
