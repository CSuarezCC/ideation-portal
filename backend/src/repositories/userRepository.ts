import type { User } from '../shared/types/index.js'
import { dbGet, dbScan } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const table = () => process.env.USERS_TABLE!

export const userRepository = {
  async getById(userId: string) {
    return dbGet<User>({ TableName: table(), Key: { userId } })
  },

  async getName(userId: string): Promise<string> {
    const user = await this.getById(userId)
    return user?.name ?? 'Anonymous'
  },

  async listActive() {
    const { items } = await dbScan<User>({ TableName: table(), FilterExpression: '#s = :active', ExpressionAttributeNames: { '#s': 'status' }, ExpressionAttributeValues: { ':active': 'ACTIVE' } })
    return items
  },

  async listByRole(role: string) {
    const { items } = await dbScan<User>({ TableName: table(), FilterExpression: '#r = :role', ExpressionAttributeNames: { '#r': 'role' }, ExpressionAttributeValues: { ':role': role } })
    return items
  },

  async update(userId: string, fields: { name?: string; department?: string; avatarUrl?: string }) {
    const updates: string[] = ['updatedAt = :now']
    const values: Record<string, unknown> = { ':now': new Date().toISOString() }
    if (fields.name !== undefined) { updates.push('#n = :n'); values[':n'] = fields.name }
    if (fields.department !== undefined) { updates.push('department = :d'); values[':d'] = fields.department }
    if (fields.avatarUrl !== undefined) { updates.push('avatarUrl = :a'); values[':a'] = fields.avatarUrl }

    const names: Record<string, string> = {}
    if (fields.name !== undefined) names['#n'] = 'name'

    await db.send(new UpdateCommand({
      TableName: table(), Key: { userId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
      ExpressionAttributeValues: values,
    }))
  },

  async setRole(userId: string, role: string) {
    await db.send(new UpdateCommand({
      TableName: table(), Key: { userId },
      UpdateExpression: 'SET #r = :r, updatedAt = :now',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':r': role, ':now': new Date().toISOString() },
    }))
  },

  async deactivate(userId: string) {
    await db.send(new UpdateCommand({
      TableName: table(), Key: { userId },
      UpdateExpression: 'SET #s = :s, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'INACTIVE', ':now': new Date().toISOString() },
    }))
  },
}
