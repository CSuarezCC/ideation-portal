# NFR Design Patterns — Unit 6: Notifications

## Inherited Patterns (from Units 1-5)

- **Retry with Exponential Backoff** — applied to DynamoDB writes and EventBridge
- **Structured Error Responses** — same error envelope
- **Middleware Chain (RBAC)** — all endpoints require auth
- **Environment-Based Configuration** — table names via env vars

---

## Pattern 21: Cursor-Based Pagination

**Problem**: Notification list needs efficient pagination without counting offsets.

**Solution**: Use DynamoDB's `ExclusiveStartKey` / `LastEvaluatedKey` as cursor, base64-encoded for the client.

```
getNotifications(userId, nextPageToken?):
  params = { PK: userId, ScanIndexForward: false, Limit: 20 }
  if nextPageToken:
    params.ExclusiveStartKey = base64Decode(nextPageToken)
  result = Query(params)
  return {
    notifications: result.Items,
    nextPageToken: result.LastEvaluatedKey ? base64Encode(result.LastEvaluatedKey) : null
  }
```

---

## Pattern 22: Batch Notification Broadcast

**Problem**: Campaign events need to notify many users (up to 5,000). Single PutItem per user is too slow.

**Solution**: Use DynamoDB `BatchWriteItem` in chunks of 25 (DynamoDB limit).

```
broadcastNotification(userIds, notificationTemplate):
  items = userIds.map(userId => ({
    PutRequest: { Item: { userId, notificationId: ulid(), ...template } }
  }))
  chunks = splitIntoChunks(items, 25)
  for chunk in chunks:
    result = BatchWriteItem(chunk)
    if result.UnprocessedItems:
      retry(result.UnprocessedItems)  // exponential backoff
```

---

## Pattern 23: Deterministic Idempotency Key

**Problem**: EventBridge may deliver the same event multiple times. Must prevent duplicate notifications.

**Solution**: Generate notificationId deterministically from eventId + userId. DynamoDB PutItem with `attribute_not_exists` condition.

```
createNotification(userId, event):
  notificationId = deterministicId(event.id, userId)  // hash-based
  try:
    PutItem(notification, ConditionExpression: attribute_not_exists(notificationId))
  catch ConditionalCheckFailedException:
    // Duplicate — silently succeed
```

**Note**: For broadcast notifications, use `eventId + userId` as input to generate unique but deterministic IDs per recipient.

---

## Pattern 24: Event Router

**Problem**: Single EventBridge consumer Lambda handles multiple event types with different recipient resolution logic.

**Solution**: Router pattern — switch on `detail-type` and delegate to type-specific handlers.

```
processEvent(event):
  switch event['detail-type']:
    'idea.submitted'              → handleIdeaSubmitted(event.detail)
    'campaign.activated'          → handleCampaignActivated(event.detail)
    'campaign.evaluation-started' → handleCampaignEvalStarted(event.detail)
    'campaign.closed'             → handleCampaignClosed(event.detail)
    'evaluation.aggregation-complete' → handleEvalComplete(event.detail)
    'recognition.winners-announced'   → console.log('Placeholder', event.detail)
    default → console.warn('Unknown event type', event['detail-type'])
```

---

## New Error Codes

| Code | HTTP | Description |
|---|---|---|
| NOTIFICATION_NOT_FOUND | 404 | Notification ID does not exist for this user |
