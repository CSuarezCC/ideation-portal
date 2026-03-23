# NFR Requirements — Unit 7: Recognition System

## Performance

| Requirement | Target | Notes |
|---|---|---|
| processWinners (event consumer) | < 3s | Query aggregated scores + batch write 3 winners + 1 announcement |
| announceWinners (Admin API) | < 3s | Update winners + announcement + campaign + ideas + publish event |
| GET /recognition/{campaignId}/winners | < 500ms (p95) | Single DynamoDB Query (PK: campaignId) |
| GET /recognition/{campaignId}/announcement | < 300ms (p95) | Single DynamoDB GetItem |

## Scalability

| Requirement | Target | Notes |
|---|---|---|
| Winners per campaign | Fixed at 3 | Strict top 3 by design |
| Concurrent reads | 500–5,000 | Lambda auto-scales; read-heavy pattern |
| Campaign close events | 1 at a time | Only one campaign active at a time per FR-03 |

## Availability

| Requirement | Target | Notes |
|---|---|---|
| Uptime | 99.9% | Inherited from managed services |
| Event consumer resilience | At-least-once | Idempotent — checks if winners already exist before writing |

## Security

| Requirement | Approach |
|---|---|
| Announce endpoint | Admin role only — enforced server-side via JWT role check |
| Read endpoints | All authenticated users — no role restriction |
| Data integrity | Winner determination uses server-side aggregated scores only |

## Reliability

| Requirement | Approach |
|---|---|
| Idempotent winner determination | Check if WinnerRecords exist for campaignId before processing |
| Idempotent announcement | Check if already announced (announcedAt not null) before processing |
| Partial failure on announce | Transaction-like: update all records, publish event last |

## Maintainability

| Requirement | Approach |
|---|---|
| Shared patterns | Reuse shared middleware, DB client, error utilities from Unit 1 |
| New types | Added to shared types (WinnerRecord, WinnerAnnouncement, BadgeType) |
| Handler structure | Same pattern as Units 1-6 |
