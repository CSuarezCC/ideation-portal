# Code Generation Plan — Unit 6: Notifications

## Unit Context
- **Dependencies**: Unit 1 (auth, shared middleware), EventBridge events from Units 2, 3, 4, 7
- **Tables**: NotificationsTable (PK: userId, SK: notificationId), reads from Ideas, Campaigns, Users
- **Events Consumed**: idea.submitted, campaign.activated, campaign.evaluation-started, campaign.closed, evaluation.aggregation-complete, recognition.winners-announced (placeholder)
- **Key Patterns**: Cursor-based pagination (P21), batch broadcast (P22), deterministic idempotency (P23), event router (P24)

## Steps

- [x] Step 1: Shared Types — Add Notification, NotificationType interfaces + NOTIFICATION_NOT_FOUND error code
- [x] Step 2: Backend — getNotifications handler (cursor-based pagination)
- [x] Step 3: Backend — getUnreadCount handler
- [x] Step 4: Backend — markAsRead handler
- [x] Step 5: Backend — markAllAsRead handler
- [x] Step 6: Backend — processEvent handler (EventBridge consumer with event router)
- [x] Step 7: Verify/update NotificationsTable in template.yaml (PK: userId, SK: notificationId)
- [x] Step 8: SAM template.yaml — Add 4 API Lambda functions + 1 EventBridge consumer
- [x] Step 9: Frontend — notificationService.ts
- [x] Step 10: Frontend — NotificationBell shared component
- [x] Step 11: Frontend — NotificationCenterPage
- [x] Step 12: Frontend — Router update (App.tsx) + AppShell update (add NotificationBell)
- [x] Step 13: Code Summary Documentation
