# Logical Components — Unit 6: Notifications

## Backend Lambda Handlers

### API Handlers (backend/src/handlers/notifications/)

| Handler | Route | Method | Auth | Description |
|---|---|---|---|---|
| getNotifications | /notifications | GET | All roles | Paginated notification list (Pattern 21) |
| getUnreadCount | /notifications/unread-count | GET | All roles | Unread notification count |
| markAsRead | /notifications/{notificationId}/read | PUT | All roles | Mark single notification as read |
| markAllAsRead | /notifications/read-all | PUT | All roles | Batch mark all as read |

### EventBridge Consumer (backend/src/handlers/notifications/)

| Handler | Trigger | Description |
|---|---|---|
| processEvent | EventBridge rule | Routes events to type-specific handlers (Pattern 24) |

---

## Frontend Components

### Shared Components

| Component | Location | Description |
|---|---|---|
| NotificationBell | components/ui/NotificationBell.tsx | Header bell icon with unread badge, 30s polling |

### Pages

| Page | Route | Access | Description |
|---|---|---|---|
| NotificationCenterPage | /notifications | All roles | Paginated notification list with mark-as-read |

### Frontend Services

| Service | File | Description |
|---|---|---|
| notificationService | frontend/src/services/notificationService.ts | API client for /notifications/* endpoints |

---

## Infrastructure

- 4 API Lambda functions (getNotifications, getUnreadCount, markAsRead, markAllAsRead)
- 1 EventBridge consumer Lambda (processEvent)
- 1 EventBridge rule matching events from Units 2, 3, 4, 7
- Uses existing NotificationsTable (provisioned in Unit 1 template.yaml)
- Reads from IdeasTable, CampaignsTable, UsersTable for recipient resolution
