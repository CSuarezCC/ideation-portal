# Tech Stack Decisions — Unit 6: Notifications

## Inherited from Units 1-5

All tech stack decisions carry forward. Unit 6 introduces no new technologies.

| Concern | Choice | Source |
|---|---|---|
| Runtime | Node.js 22.14.0 (Lambda) | Unit 1 |
| DynamoDB client | AWS SDK v3 | Unit 1 |
| EventBridge client | AWS SDK v3 | Unit 1 |
| Frontend | React 18 + Vite + Tailwind | Unit 1 |
| ID generation | ULID | Unit 1 |

## Unit 6-Specific Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Notification sort key | ULID (notificationId) | Time-ordered by default; doubles as unique ID and sort key |
| Pagination | Cursor-based (DynamoDB LastEvaluatedKey) | Efficient for "load more" pattern; no offset counting |
| Broadcast writes | BatchWriteItem (chunks of 25) | DynamoDB limit; handles up to 5,000 recipients |
| Polling interval | 30 seconds | Balances freshness vs. Lambda invocation cost |
| Deterministic ID for idempotency | Hash of eventId + userId | Prevents duplicate notifications on EventBridge retry |
| Recognition event handler | Placeholder (log only) | Unit 7 not yet built; will be implemented when recognition events are defined |

## DynamoDB Access Patterns — Unit 6

| Access Pattern | Table | Key/Index | Operation |
|---|---|---|---|
| Get user notifications (paginated) | Notifications | PK: userId, SK: notificationId (desc) | Query (ScanIndexForward: false, Limit: 20) |
| Get unread count | Notifications | PK: userId, Filter: isRead = false | Query (Select: COUNT) |
| Mark as read | Notifications | PK: userId, SK: notificationId | UpdateItem |
| Mark all as read | Notifications | PK: userId, Filter: isRead = false | Query + BatchWrite |
| Create notification | Notifications | PK: userId, SK: notificationId | PutItem |
| Batch create (broadcast) | Notifications | PK: userId, SK: notificationId | BatchWriteItem |
