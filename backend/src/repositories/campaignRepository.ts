import type { Campaign, CampaignStatus } from '../shared/types/index.js'
import { dbGet, dbPut, dbQuery, dbDelete } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const table = () => process.env.CAMPAIGNS_TABLE!

export const campaignRepository = {
  async getById(campaignId: string) {
    return dbGet<Campaign>({ TableName: table(), Key: { campaignId } })
  },

  async create(campaign: Campaign) {
    await dbPut({ TableName: table(), Item: campaign })
  },

  async listByStatus(status: CampaignStatus) {
    return dbQuery<Campaign>({
      TableName: table(),
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#s = :s',
      FilterExpression: 'attribute_not_exists(deletedAt)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status },
    })
  },

  async listAll() {
    return dbQuery<Campaign>({
      TableName: table(),
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'DRAFT' },
    })
  },

  async getActive() {
    const { items } = await this.listByStatus('ACTIVE')
    return items[0] ?? null
  },

  async update(campaignId: string, fields: Partial<Campaign>) {
    const updates: string[] = ['updatedAt = :now']
    const values: Record<string, unknown> = { ':now': new Date().toISOString() }
    const names: Record<string, string> = {}

    if (fields.name !== undefined) { updates.push('#n = :n'); values[':n'] = fields.name; names['#n'] = 'name' }
    if (fields.description !== undefined) { updates.push('description = :d'); values[':d'] = fields.description }
    if (fields.submissionStartDate !== undefined) { updates.push('submissionStartDate = :ssd'); values[':ssd'] = fields.submissionStartDate }
    if (fields.submissionEndDate !== undefined) { updates.push('submissionEndDate = :sed'); values[':sed'] = fields.submissionEndDate }
    if (fields.evaluationStartDate !== undefined) { updates.push('evaluationStartDate = :esd'); values[':esd'] = fields.evaluationStartDate }
    if (fields.evaluationEndDate !== undefined) { updates.push('evaluationEndDate = :eed'); values[':eed'] = fields.evaluationEndDate }

    await db.send(new UpdateCommand({
      TableName: table(), Key: { campaignId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
      ExpressionAttributeValues: values,
    }))
  },

  async updateStatus(campaignId: string, status: CampaignStatus) {
    await db.send(new UpdateCommand({
      TableName: table(), Key: { campaignId },
      UpdateExpression: 'SET #s = :s, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status, ':now': new Date().toISOString() },
    }))
  },

  async softDelete(campaignId: string) {
    await db.send(new UpdateCommand({
      TableName: table(), Key: { campaignId },
      UpdateExpression: 'SET deletedAt = :now, updatedAt = :now',
      ExpressionAttributeValues: { ':now': new Date().toISOString() },
    }))
  },

  async setPanelMembers(campaignId: string, panelMemberIds: string[]) {
    await db.send(new UpdateCommand({
      TableName: table(), Key: { campaignId },
      UpdateExpression: 'SET panelMemberIds = :p, updatedAt = :now',
      ExpressionAttributeValues: { ':p': panelMemberIds, ':now': new Date().toISOString() },
    }))
  },
}
