# Code Summary — Unit 6: Notifications

## Backend Files

| File | Status | Description |
|---|---|---|
| `backend/src/shared/types/index.ts` | Modified | Added Notification, NotificationType + NOTIFICATION_NOT_FOUND error code |
| `backend/src/shared/utils/errors.ts` | Modified | Added NOTIFICATION_NOT_FOUND to STATUS_MAP |
| `backend/src/shared/db/dynamoClient.ts` | Modified | Added dbBatchWrite helper (BatchWriteItem in chunks of 25) |
| `backend/src/notifications/getNotifications.ts` | Created | GET /notifications — cursor-based pagination |
| `backend/src/notifications/getUnreadCount.ts` | Created | GET /notifications/unread-count — count query |
| `backend/src/notifications/markAsRead.ts` | Created | PUT /notifications/{notificationId}/read — single update |
| `backend/src/notifications/markAllAsRead.ts` | Created | PUT /notifications/read-all — batch update |
| `backend/src/notifications/processEvent.ts` | Created | EventBridge consumer — routes 6 event types to notification creation |

## Frontend Files

| File | Status | Description |
|---|---|---|
| `frontend/src/services/notificationService.ts` | Created | API client for /notifications/* endpoints |
| `frontend/src/components/ui/NotificationBell.tsx` | Created | Header bell icon with unread badge, 30s polling |
| `frontend/src/pages/notifications/NotificationCenterPage.tsx` | Created | Paginated notification list with mark-as-read |
| `frontend/src/components/layout/AppShell.tsx` | Modified | Replaced stub bell with NotificationBell component, updated nav link |
| `frontend/src/App.tsx` | Modified | Added /notifications route |

## Infrastructure Files

| File | Status | Description |
|---|---|---|
| `template.yaml` | Modified | Added 4 API Lambda functions + 1 EventBridge consumer with 6 event rules |
