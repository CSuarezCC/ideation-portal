# Business Rules — Unit 6: Notifications

## BR-01: Notification Ownership
- Users can only read/modify their own notifications
- userId is derived from JWT auth context, never from request body

## BR-02: Chronological Order
- Notifications are always returned newest-first (createdAt descending)
- No priority levels — all notifications are equal (Q2:A)

## BR-03: Cursor-Based Pagination
- getNotifications uses cursor-based pagination with nextPageToken
- Default page size: 20
- nextPageToken is the DynamoDB LastEvaluatedKey (base64-encoded)

## BR-04: Notification Retention
- All notifications retained indefinitely (Q4:A)
- No automatic cleanup

## BR-05: Campaign Status Change Audience (Q5:B)
- campaign.activated: notify all users (everyone can submit)
- campaign.evaluation-started: notify idea submitters for that campaign + assigned panel members + admins
- campaign.closed: notify idea submitters for that campaign + assigned panel members + admins

## BR-06: Event-to-Notification Mapping
| Event | Recipients | Title Template |
|---|---|---|
| idea.submitted | Idea submitter | "Idea Submitted" |
| campaign.activated | All users | "New Campaign: {campaignName}" |
| campaign.evaluation-started | Submitters + panel members + admins | "Evaluation Started: {campaignName}" |
| campaign.closed | Submitters + panel members + admins | "Campaign Closed: {campaignName}" |
| evaluation.aggregation-complete | Idea submitter | "Your Idea Has Been Evaluated" |
| recognition.winners-announced | (placeholder — log only) | — |

## BR-07: Idempotent Notification Creation
- Event consumer uses notificationId (ULID) to prevent duplicates
- If EventBridge delivers the same event twice, the consumer generates a deterministic ID from eventId + userId to avoid duplicate notifications

## BR-08: Mark All As Read
- Queries all unread notifications for the user, then batch-updates them
- Returns the count of notifications marked as read

## BR-09: Unread Count
- Returns count of notifications where isRead = false for the user
- Used by the NotificationBell component for badge display

## BR-10: Recipient Resolution for Campaign Events
- For campaign.evaluation-started and campaign.closed:
  1. Query IdeasTable GSI `campaignId-status-index` to get all submitterIds
  2. Get panelMemberIds from campaign event payload
  3. Query UsersTable for admin users
  4. Deduplicate the combined list
  5. Create one notification per unique recipient
