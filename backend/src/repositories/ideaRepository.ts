import type { Idea, IdeaStatus } from '../shared/types/index.js'
import { dbGet, dbPut, dbQuery, dbDelete } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const table = () => process.env.IDEAS_TABLE!

export const ideaRepository = {
  async getById(ideaId: string) {
    return dbGet<Idea>({ TableName: table(), Key: { ideaId } })
  },

  async create(idea: Idea) {
    await dbPut({ TableName: table(), Item: idea })
  },

  async remove(ideaId: string) {
    await dbDelete({ TableName: table(), Key: { ideaId } })
  },

  async updateFields(ideaId: string, fields: Record<string, unknown>) {
    const updates: string[] = ['updatedAt = :now']
    const values: Record<string, unknown> = { ':now': new Date().toISOString() }
    const names: Record<string, string> = {}
    let i = 0
    for (const [key, val] of Object.entries(fields)) {
      if (val === undefined) continue
      const alias = `:v${i++}`
      if (key === 'status') { updates.push('#s = ' + alias); names['#s'] = 'status' }
      else { updates.push(`${key} = ${alias}`) }
      values[alias] = val
    }
    await db.send(new UpdateCommand({
      TableName: table(), Key: { ideaId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
      ExpressionAttributeValues: values,
    }))
  },

  async updateStatus(ideaId: string, status: IdeaStatus) {
    await db.send(new UpdateCommand({
      TableName: table(), Key: { ideaId },
      UpdateExpression: 'SET #s = :s, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status, ':now': new Date().toISOString() },
    }))
  },

  async listByCampaign(campaignId: string, excludeDrafts = true) {
    const params: any = {
      TableName: table(),
      IndexName: 'campaignId-status-index',
      KeyConditionExpression: 'campaignId = :c',
      ExpressionAttributeValues: { ':c': campaignId } as Record<string, unknown>,
    }
    if (excludeDrafts) {
      params.FilterExpression = '#s <> :draft'
      params.ExpressionAttributeNames = { '#s': 'status' }
      params.ExpressionAttributeValues[':draft'] = 'DRAFT'
    }
    return dbQuery<Idea>(params)
  },

  async listByCampaignAndStatus(campaignId: string, status?: string) {
    const params: any = {
      TableName: table(),
      IndexName: 'campaignId-status-index',
      KeyConditionExpression: status ? 'campaignId = :c AND #s = :s' : 'campaignId = :c',
      ExpressionAttributeValues: { ':c': campaignId } as Record<string, unknown>,
    }
    if (status) {
      params.ExpressionAttributeNames = { '#s': 'status' }
      params.ExpressionAttributeValues[':s'] = status
    }
    return dbQuery<Idea>(params)
  },

  async listBySubmitter(submitterId: string, status?: string) {
    const params: any = {
      TableName: table(),
      IndexName: 'submitterId-index',
      KeyConditionExpression: 'submitterId = :uid',
      ExpressionAttributeValues: { ':uid': submitterId } as Record<string, unknown>,
    }
    if (status) {
      params.FilterExpression = '#s = :s'
      params.ExpressionAttributeNames = { '#s': 'status' }
      params.ExpressionAttributeValues[':s'] = status
    }
    return dbQuery<Idea>(params)
  },
}
