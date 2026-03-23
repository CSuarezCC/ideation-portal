# NFR Design Patterns — Unit 4: Evaluation Engine

## Inherited Patterns (from Units 1-3)

- **Retry with Exponential Backoff** — applied to DynamoDB writes and EventBridge publishes
- **Structured Error Responses** — same error envelope
- **Middleware Chain (RBAC)** — requireRole on evaluation endpoints
- **Environment-Based Configuration** — table names via env vars

---

## Pattern 12: Blind Scoring Enforcement

**Problem**: Panel Members must not see others' scores before submitting their own. This must be enforced server-side — client-side hiding is insufficient.

**Solution**: `getEvaluationSummary` handler checks if the requesting panel member has a SUBMITTED evaluation for the idea before returning individual score breakdowns.

```
getEvaluationSummary(ideaId, requestingUserId):
  aggregated = GetItem(AggregatedScores, ideaId)
  if !aggregated → return { status: 'PENDING' }

  if requester.role === 'ADMIN':
    return full summary (averages + anonymized individuals + justifications)

  myEval = GetItem(Evaluations, ideaId, requestingUserId)
  if myEval?.status === 'SUBMITTED':
    return full summary (averages + anonymized individuals + justifications)
  else:
    return { status: 'BLIND', averages only (no individual breakdown) }
```

**Key**: The anonymized evaluations array in AggregatedScore uses shuffled indices (1, 2, 3...) — never real panel member IDs.

---

## Pattern 13: Idempotent Aggregation with Conditional Write

**Problem**: If two panel members submit simultaneously and both detect "all scored", two aggregation attempts could race.

**Solution**: Use DynamoDB conditional PutItem with `attribute_not_exists(ideaId)` on AggregatedScores table.

```
triggerAggregation(ideaId, campaignId):
  evaluations = Query(Evaluations, ideaId) where status=SUBMITTED
  // Calculate averages...
  try:
    PutItem(AggregatedScores, aggregated, ConditionExpression: attribute_not_exists(ideaId))
    UpdateItem(Ideas, ideaId, status=EVALUATED)
    Publish('evaluation.aggregation-complete')
  catch ConditionalCheckFailedException:
    // Another handler already aggregated — silently succeed
    return GetItem(AggregatedScores, ideaId)
```

---

## Pattern 14: In-Lambda Join for Evaluation Queue

**Problem**: The evaluation queue needs idea data + per-panel-member evaluation status. This data lives in two tables.

**Solution**: Two parallel DynamoDB queries joined in Lambda. Acceptable because:
- Ideas query: GSI on campaignId (returns ≤ thousands of items, paginated)
- Evaluations query: GSI on panelMemberId (returns ≤ hundreds of items for one panel member)
- Join is O(N) with a Map lookup — trivial compute

```
getIdeasForEvaluation(panelMemberId, campaignId):
  [ideas, myEvals] = await Promise.all([
    Query(Ideas, campaignId-status-index, status IN [SUBMITTED, UNDER_REVIEW, EVALUATED]),
    Query(Evaluations, panelMemberId-index, panelMemberId)
  ])
  evalMap = Map(myEvals by ideaId)
  return ideas.map(idea => ({
    ...idea,
    evaluationStatus: evalMap[idea.ideaId]?.status === 'SUBMITTED' ? 'COMPLETED'
                    : evalMap[idea.ideaId] ? 'IN_PROGRESS' : 'NOT_STARTED'
  })).sort(byEvalStatusThenSubmittedAt)
```

---

## Pattern 15: Score Validation

**Problem**: Scores must be integers 1–10 with non-empty justifications. Must be enforced server-side.

**Solution**: Validation function shared between saveProgress (lenient) and submit (strict).

```
validateScores(data, strict):
  if strict:
    require all 3 scores present, integer, 1-10
    require all 3 justifications non-empty strings
  else (draft):
    if score present, must be integer 1-10
    justifications optional
```
