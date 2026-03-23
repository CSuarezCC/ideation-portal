import type { Notification } from '../shared/types/index.js'
import { dbPut, dbQuery, dbUpdate, dbBatchWrite } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'

const table = () => process.env.NOTIFICATIONS_TABLE!

export const notificationRepository = {
  async listByUser(userId: string, limit = 20, exclusiveStartKey?: Record<string, unknown>) {
    const params: any = {
      TableName: table(),
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
      Limit: limit,
    }
    if (exclusiveStartKey) params.ExclusiveStartKey = exclusiveStartKey
    return dbQuery<Notification>(params)
  },

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.send(new QueryCommand({
      TableName: table(),
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: 'isRead = :false',
      ExpressionAttributeValues: { ':uid': userId, ':false': false },
      Select: 'COUNT',
    }))
    return result.Count ?? 0
  },

  async markAsRead(userId: string, notificationId: string) {
    await dbUpdate({
      TableName: table(),
      Key: { userId, notificationId },
      UpdateExpression: 'SET isRead = :true',
      ConditionExpression: 'attribute_exists(notificationId)',
      ExpressionAttributeValues: { ':true': true },
    })
  },

  async markAllAsRead(userId: string) {
    const { items: unread } = await dbQuery<Notification>({
      TableName: table(),
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: 'isRead = :false',
      ExpressionAttributeValues: { ':uid': userId, ':false': false },
    })
    await Promise.all(unread.map(n =>
      dbUpdate({
        TableName: table(),
        Key: { userId, notificationId: n.notificationId },
        UpdateExpression: 'SET isRead = :true',
        ExpressionAttributeValues: { ':true': true },
      })
    ))
    return unread.length
  },

  async create(notification: Notification) {
    await dbPut({ TableName: table(), Item: notification })
  },

  async createBatch(notifications: Notification[]) {
    await dbBatchWrite(table(), notifications as unknown as Record<string, unknown>[])
  },
}
