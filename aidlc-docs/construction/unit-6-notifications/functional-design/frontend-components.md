# Frontend Components — Unit 6: Notifications

## Components

### NotificationBell (shared component — header)
- **Location**: `frontend/src/components/ui/NotificationBell.tsx`
- **Placement**: AppShell header, visible on all authenticated pages
- **Behavior**:
  - Polls `getUnreadCount` on mount and every 30 seconds
  - Displays bell icon with red badge showing unread count (hidden if 0)
  - Click navigates to `/notifications`
- **Props**: none (uses auth context for userId)
- **API**: `notificationService.getUnreadCount()`

### NotificationCenterPage
- **Route**: `/notifications`
- **Access**: All authenticated users
- **Layout**:
  - "Mark All as Read" button (top right)
  - List of notification cards, newest first
  - Each card: title, message, timestamp, read/unread indicator
  - Click on unread notification marks it as read
  - "Load More" button at bottom (cursor-based pagination)
- **State**: notifications[], nextPageToken, unreadCount, loading
- **API**: `notificationService.getNotifications(nextPageToken?)`, `notificationService.markAsRead(notificationId)`, `notificationService.markAllAsRead()`

---

## API Integration

| Component | Endpoint | Service |
|---|---|---|
| NotificationBell | GET /notifications/unread-count | notificationService |
| NotificationCenterPage | GET /notifications | notificationService |
| NotificationCenterPage | PUT /notifications/{id}/read | notificationService |
| NotificationCenterPage | PUT /notifications/read-all | notificationService |
