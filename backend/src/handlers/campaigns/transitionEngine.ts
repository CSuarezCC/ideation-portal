import type { Campaign, CampaignStatus } from '../../shared/types/index.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { publishEvent } from '../../shared/events/eventBridgeClient.js'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { db, dbQuery } from '../../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const TRANSITIONS: { from: CampaignStatus; to: CampaignStatus; dateField: keyof Campaign; event: string }[] = [
  { from: 'DRAFT', to: 'ACTIVE', dateField: 'submissionStartDate', event: 'CampaignActivated' },
  { from: 'ACTIVE', to: 'EVALUATION', dateField: 'evaluationStartDate', event: 'CampaignEvaluationStarted' },
  { from: 'EVALUATION', to: 'CLOSED', dateField: 'evaluationEndDate', event: 'CampaignClosed' },
]

export async function checkAndTransition(campaign: Campaign): Promise<Campaign> {
  const now = new Date()
  let current = campaign
  for (const t of TRANSITIONS) {
    if (current.status !== t.from) continue
    const dateVal = current[t.dateField] as string
    if (new Date(dateVal) > now) break
    if (t.to === 'ACTIVE') {
      const { items } = await dbQuery<Campaign>({
        TableName: process.env.CAMPAIGNS_TABLE!,
        IndexName: 'status-createdAt-index',
        KeyConditionExpression: '#s = :s',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': 'ACTIVE' },
      })
      if (items.some(c => c.campaignId !== campaign.campaignId)) break
    }
    try {
      await db.send(new UpdateCommand({
        TableName: process.env.CAMPAIGNS_TABLE!,
        Key: { campaignId: campaign.campaignId },
        UpdateExpression: 'SET #s = :new, updatedAt = :now',
        ConditionExpression: '#s = :old',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':new': t.to, ':old': t.from, ':now': now.toISOString() },
      }))
      await publishEvent(t.event, { campaignId: campaign.campaignId, campaignName: campaign.name, status: t.to, panelMemberIds: campaign.panelMemberIds, timestamp: now.toISOString() })
      current = { ...current, status: t.to }
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) break
      throw err
    }
  }
  return current
}
