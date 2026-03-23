# Domain Entities — Unit 6: Notifications

## Notification

| Field | Type | Description |
|---|---|---|
| notificationId | string (ULID) | Unique identifier |
| userId | string (PK) | Recipient user ID |
| type | NotificationType | Event type that triggered this notification |
| title | string | Short notification title |
| message | string | Notification body text |
| resourceId | string | Related resource ID (ideaId, campaignId, etc.) |
| resourceType | string | 'idea' \| 'campaign' \| 'evaluation' \| 'recognition' |
| isRead | boolean | Read status |
| createdAt | string (ISO 8601) | Creation timestamp (SK — sort key, descending) |

### NotificationType Enum

| Value | Trigger Event | Description |
|---|---|---|
| IDEA_SUBMITTED | idea.submitted | Confirmation to submitter |
| CAMPAIGN_ACTIVATED | campaign.activated | Campaign open for submissions |
| CAMPAIGN_EVALUATION_STARTED | campaign.evaluation-started | Evaluation period began |
| CAMPAIGN_CLOSED | campaign.closed | Campaign closed |
| EVALUATION_COMPLETE | evaluation.aggregation-complete | All panel members scored an idea |
| WINNERS_ANNOUNCED | recognition.winners-announced | Top 3 winners announced (placeholder) |

---

## DynamoDB Table Design

### NotificationsTable
- **Partition Key**: `userId` (string)
- **Sort Key**: `createdAt` (string, ISO 8601) — enables chronological queries
- **GSI**: None needed — all queries are per-user

### Access Patterns
| Pattern | Key | Operation |
|---|---|---|
| Get user notifications (paginated) | PK: userId, SK: createdAt (desc) | Query with ScanIndexForward: false, Limit + ExclusiveStartKey |
| Get unread count | PK: userId, FilterExpression: isRead = false | Query with Select: COUNT |
| Mark as read | PK: userId, SK: createdAt | UpdateItem |
| Mark all as read | PK: userId, FilterExpression: isRead = false | Query + BatchWrite |
| Create notification | PK: userId, SK: createdAt | PutItem |
