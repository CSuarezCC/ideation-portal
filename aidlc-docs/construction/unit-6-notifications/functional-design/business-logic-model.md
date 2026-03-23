# Business Logic Model — Unit 6: Notifications

## API Handlers

### getNotifications(userId, nextPageToken?)
1. Query NotificationsTable PK: userId, ScanIndexForward: false, Limit: 20
2. If nextPageToken provided, decode base64 → ExclusiveStartKey
3. Return { notifications[], nextPageToken (base64 of LastEvaluatedKey) | null }

### getUnreadCount(userId)
1. Query NotificationsTable PK: userId, FilterExpression: isRead = false, Select: COUNT
2. Return { count }

### markAsRead(notificationId, userId)
1. Query NotificationsTable to find notification by userId + createdAt
   - notificationId is embedded in the notification record; scan user's notifications to find matching createdAt
   - Alternative: store notificationId as a secondary attribute and use it for lookup
2. UpdateItem: set isRead = true
3. Return { success: true }

**Design note**: Since DynamoDB key is (userId, createdAt), we need notificationId to locate the item. Store notificationId as an attribute and use a filter on query, or pass createdAt as the identifier. For simplicity, use `createdAt` as the notification identifier in API paths (URL-encoded ISO string).

**Revised approach**: Use `notificationId` (ULID) as the sort key instead of `createdAt`. ULIDs are time-ordered, so chronological sorting is preserved.

### Revised Table Key Design
- **PK**: userId
- **SK**: notificationId (ULID — time-ordered, so ScanIndexForward: false gives newest first)

### markAsRead(notificationId, userId)
1. UpdateItem: PK: userId, SK: notificationId, set isRead = true
2. Return { success: true }

### markAllAsRead(userId)
1. Query NotificationsTable PK: userId, FilterExpression: isRead = false
2. For each unread notification, UpdateItem: set isRead = true (batch)
3. Return { markedCount }

---

## EventBridge Consumer Handler

### processEvent(event)
1. Parse event detail-type to determine NotificationType
2. Route to appropriate handler:

#### idea.submitted
- Recipient: event.detail.submitterId
- Create 1 notification: "Idea Submitted — {ideaTitle}"

#### campaign.activated
- Recipients: all users (scan UsersTable for ACTIVE users)
- Create 1 notification per user: "New Campaign: {campaignName}"

#### campaign.evaluation-started
- Recipients: resolve per BR-10 (submitters + panel members + admins)
- Create 1 notification per recipient: "Evaluation Started: {campaignName}"

#### campaign.closed
- Recipients: resolve per BR-10 (submitters + panel members + admins)
- Create 1 notification per recipient: "Campaign Closed: {campaignName}"

#### evaluation.aggregation-complete
- Recipient: idea submitter (look up idea to get submitterId)
- Create 1 notification: "Your Idea Has Been Evaluated — {ideaTitle}"

#### recognition.winners-announced
- Placeholder: log event, no notifications created yet (Q3:B)
