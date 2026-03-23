import { ulid } from 'ulid'
import type { Notification, NotificationType } from '../shared/types/index.js'
import { notificationRepository } from '../repositories/notificationRepository.js'
import { userRepository } from '../repositories/userRepository.js'

export const notificationService = {
  async createForUser(userId: string, type: NotificationType, title: string, message: string, resourceId: string, resourceType: Notification['resourceType']) {
    await notificationRepository.create({
      userId, notificationId: ulid(), type, title, message, resourceId, resourceType,
      isRead: false, createdAt: new Date().toISOString(),
    })
  },

  async broadcastToAllActive(type: NotificationType, title: string, message: string, resourceId: string, resourceType: Notification['resourceType']) {
    const users = await userRepository.listActive()
    const items = users.map(u => ({
      userId: u.userId, notificationId: ulid(), type, title, message, resourceId, resourceType,
      isRead: false, createdAt: new Date().toISOString(),
    }))
    await notificationRepository.createBatch(items)
  },

  async broadcastToUsers(userIds: string[], type: NotificationType, title: string, message: string, resourceId: string, resourceType: Notification['resourceType']) {
    const items = userIds.map(userId => ({
      userId, notificationId: ulid(), type, title, message, resourceId, resourceType,
      isRead: false, createdAt: new Date().toISOString(),
    }))
    await notificationRepository.createBatch(items)
  },
}
