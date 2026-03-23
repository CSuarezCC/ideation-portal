import { apiClient } from './apiClient'

export interface Notification {
  userId: string
  notificationId: string
  type: string
  title: string
  message: string
  resourceId: string
  resourceType: string
  isRead: boolean
  createdAt: string
}

export const notificationService = {
  getNotifications: (nextPageToken?: string) =>
    apiClient.get<{ notifications: Notification[]; nextPageToken: string | null }>('/notifications', { params: nextPageToken ? { nextPageToken } : {} }).then(r => r.data),
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then(r => r.data.count),
  markAsRead: (notificationId: string) =>
    apiClient.put(`/notifications/${notificationId}/read`).then(r => r.data),
  markAllAsRead: () =>
    apiClient.put<{ markedCount: number }>('/notifications/read-all').then(r => r.data),
}
