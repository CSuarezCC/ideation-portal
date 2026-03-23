# NFR Requirements — Unit 6: Notifications

## Performance

| Requirement | Target | Notes |
|---|---|---|
| getNotifications | < 500ms (p95) | Single DynamoDB Query (PK: userId, limit 20) |
| getUnreadCount | < 300ms (p95) | DynamoDB Query with Select: COUNT |
| markAsRead | < 300ms (p95) | Single DynamoDB UpdateItem |
| markAllAsRead | < 1s (p95) | Query unread + batch update (typically < 50 items) |
| Event consumer (single recipient) | < 500ms | Single PutItem |
| Event consumer (campaign broadcast) | < 5s | Batch write for all recipients |

## Scalability

| Requirement | Target | Notes |
|---|---|---|
| Notifications per user | Unlimited | DynamoDB on-demand, ULID sort key |
| Campaign broadcast | Up to 5,000 users | BatchWriteItem in chunks of 25 |
| Concurrent polling | 500–5,000 | Lambda auto-scales; 30s polling interval limits load |

## Availability

| Requirement | Target | Notes |
|---|---|---|
| Uptime | 99.9% | Inherited from managed services |
| Event consumer resilience | At-least-once | EventBridge retries on Lambda failure; idempotent writes prevent duplicates |

## Security

| Requirement | Approach |
|---|---|
| Notification ownership | Server-side: userId from JWT, never from request body |
| No cross-user access | All queries scoped to authenticated userId |
| Role enforcement | All endpoints require authentication; no role restriction (all roles can read own notifications) |

## Reliability

| Requirement | Approach |
|---|---|
| Duplicate event handling | Deterministic notificationId from eventId + userId prevents duplicates |
| Batch write partial failure | Retry unprocessed items from BatchWriteItem response |
| Missing recipient data | Skip notification for unresolvable users; log warning |

## Maintainability

| Requirement | Approach |
|---|---|
| Shared patterns | Reuse Unit 1 shared middleware, DB client, error utilities |
| Notification types | Added to shared types |
| Handler structure | Same pattern as Units 1-5 |
