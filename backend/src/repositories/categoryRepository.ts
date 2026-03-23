import type { Category } from '../shared/types/index.js'
import { dbGet, dbPut, dbQuery } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const table = () => process.env.CATEGORIES_TABLE!

export const categoryRepository = {
  async getById(categoryId: string) {
    return dbGet<Category>({ TableName: table(), Key: { categoryId } })
  },

  async listActive() {
    const { items } = await dbQuery<Category>({
      TableName: table(),
      IndexName: 'isActive-name-index',
      KeyConditionExpression: 'isActive = :a',
      ExpressionAttributeValues: { ':a': 'true' },
    })
    return items
  },

  async findActiveByName(name: string) {
    const { items } = await dbQuery<Category>({
      TableName: table(),
      IndexName: 'isActive-name-index',
      KeyConditionExpression: 'isActive = :a AND #n = :n',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: { ':a': 'true', ':n': name },
    })
    return items[0] ?? null
  },

  async create(category: Category) {
    await dbPut({ TableName: table(), Item: category })
  },

  async update(categoryId: string, fields: { name?: string; description?: string }) {
    const current = await this.getById(categoryId)
    await db.send(new UpdateCommand({
      TableName: table(), Key: { categoryId },
      UpdateExpression: 'SET #n = :n, description = :d, updatedAt = :now',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: {
        ':n': fields.name ?? current?.name,
        ':d': fields.description ?? current?.description ?? null,
        ':now': new Date().toISOString(),
      },
    }))
  },

  async toggleActive(categoryId: string, isActive: string) {
    await db.send(new UpdateCommand({
      TableName: table(), Key: { categoryId },
      UpdateExpression: 'SET isActive = :a, updatedAt = :now',
      ExpressionAttributeValues: { ':a': isActive, ':now': new Date().toISOString() },
    }))
  },
}
