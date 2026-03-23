# NFR Requirements — Unit 5: Dashboards, Leaderboard & Analytics

## Performance

| Requirement | Target | Notes |
|---|---|---|
| getLeaderboard (composite) | < 1s (p95) | Single DynamoDB GSI query on AggregatedScores + batch GetItem for idea titles + user names |
| getLeaderboard (other dimensions) | < 1.5s (p95) | GSI query + in-memory sort by requested dimension |
| getLeaderboard (most_recent) | < 1s (p95) | IdeasTable GSI query + optional AggregatedScore lookups |
| getIdeaDetail | < 500ms (p95) | 3 GetItem calls (idea + aggregated score + user) |
| getLeaderboardSummary | < 800ms (p95) | GSI query + in-memory aggregation |
| searchIdeas | < 2s (p95) | GSI query + in-memory keyword filter (acceptable for campaign-scoped data) |
| getTopIdeas | < 800ms (p95) | GSI query (limit N) + batch GetItem for titles |
| getComparativeAnalysis | < 1.5s (p95) | Full GSI scan for campaign + join |
| getParticipationMetrics | < 1s (p95) | Two count queries (ideas + aggregated scores) + campaign GetItem |
| getScoreDistribution | < 1s (p95) | GSI query + in-memory bucketing |
| getCampaignSummary | < 2s (p95) | Composite of participation + top ideas + distributions |

## Scalability

| Requirement | Target | Notes |
|---|---|---|
| Ideas per campaign | Thousands | All queries are campaign-scoped via GSI |
| Concurrent dashboard users | 500–5,000 | Lambda auto-scales; DynamoDB on-demand |
| Leaderboard load | All items at once | Acceptable — campaign-scoped data is bounded |

## Availability

| Requirement | Target | Notes |
|---|---|---|
| Uptime | 99.9% | Inherited from managed services |
| Read-only resilience | High | No write operations — failures are transient read errors |

## Security

| Requirement | Approach |
|---|---|
| Author anonymization | Server-side: strip submitterName for Employee role (BR-01) |
| Analytics access control | Server-side: reject Employee role on all analytics endpoints (BR-04) |
| Individual evaluation visibility | Server-side: only include anonymized evaluations for Admin/Panel Member (BR-08) |
| Role enforcement | Reuse Unit 1 Lambda Authorizer + RBAC middleware |

## Reliability

| Requirement | Approach |
|---|---|
| Partial data handling | If AggregatedScore not found for an idea, return null scores (idea still appears in Most Recent tab) |
| User name resolution failure | Fallback to "Anonymous" if UsersTable lookup fails |
| Empty campaign | Return empty arrays/zero counts — no errors |

## Maintainability

| Requirement | Approach |
|---|---|
| Shared patterns | Reuse Unit 1 shared middleware, DB client, error utilities |
| Dashboard types | Added to shared types (LeaderboardEntry, IdeaDetail, etc.) |
| Handler structure | Same pattern as Units 1-4 |
| Charting library | Recharts — added as frontend dependency |
