# NFR Requirements — Unit 4: Evaluation Engine

## Performance

| Requirement | Target | Notes |
|---|---|---|
| Evaluation queue (getIdeasForEvaluation) | < 1s (p95) | Two DynamoDB queries (ideas by campaign + evaluations by panelMember) joined in Lambda |
| Save evaluation progress | < 500ms (p95) | Single DynamoDB PutItem/UpdateItem |
| Submit evaluation (no aggregation) | < 800ms (p95) | DynamoDB write + EventBridge publish + aggregation check query |
| Submit evaluation (with aggregation) | < 1.5s (p95) | Above + aggregation math + AggregatedScore write + Idea status update |
| Get my evaluation | < 300ms (p95) | Single DynamoDB GetItem |
| Get evaluation summary | < 500ms (p95) | Single DynamoDB GetItem on AggregatedScores (pre-computed) |
| Get aggregated score | < 300ms (p95) | Single DynamoDB GetItem |

## Scalability

| Requirement | Target | Notes |
|---|---|---|
| Concurrent evaluations | 500–5,000 | Lambda auto-scales; DynamoDB on-demand |
| Panel members per campaign | Up to 50 | Aggregation iterates all evaluations — O(N) where N ≤ 50 |
| Ideas per campaign | Thousands | GSI queries handle efficiently |
| Evaluations per idea | Up to 50 (one per panel member) | Small dataset for aggregation math |

## Availability

| Requirement | Target | Notes |
|---|---|---|
| Uptime | 99.9% | Inherited from managed services |
| Draft evaluation resilience | Best-effort | If save fails, user retains data in browser |

## Security

| Requirement | Approach |
|---|---|
| Blind scoring enforcement | Server-side: getEvaluationSummary checks requester has SUBMITTED evaluation before returning individual scores |
| Panel member authorization | Server-side: verify panelMemberId is in campaign's panelMemberIds array |
| Score immutability | Server-side: reject updates to SUBMITTED evaluations |
| Role enforcement | Only PANEL_MEMBER and ADMIN can access evaluation endpoints; Admin cannot submit evaluations |

## Reliability

| Requirement | Approach |
|---|---|
| Aggregation atomicity | Aggregation writes AggregatedScore + updates Idea status. If idea status update fails, aggregated score still exists — can be retried |
| EventBridge publish failure | Non-blocking: evaluation is still saved even if event publish fails |
| Duplicate aggregation prevention | Conditional DynamoDB PutItem (attribute_not_exists) on AggregatedScore to prevent double-write |

## Maintainability

| Requirement | Approach |
|---|---|
| Shared patterns | Reuse Unit 1 shared middleware, DB client, EventBridge client, error utilities |
| Evaluation types | Added to shared types (Evaluation, EvaluationStatus, AggregatedScore, AnonymizedEvaluation) |
| Handler structure | Same pattern as Units 1-3 |
