import type { Campaign, CampaignStatus } from '../shared/types/index.js'
import { db, dbQuery } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

const TRANSITION_MAP: Record<string, { next: CampaignStatus; dateField: keyof Campaign; eventType: string }> = {
  DRAFT: { next: 'ACTIVE', dateField: 'submissionStartDate', eventType: 'CampaignActivated' },
  ACTIVE: { next: 'EVALUATION', dateField: 'evaluationStartDate', eventType: 'CampaignEvaluationStarted' },
  EVALUATION: { next: 'CLOSED', dateField: 'evaluationEndDate', eventType: 'CampaignClosed' },
}

export async function checkAndTransition(campaign: Campaign): Promise<Campaign> {
  const rule = TRANSITION_MAP[campaign.status]
  if (!rule) return campaign

  const now = new Date().toISOString()
  if (now < (campaign[rule.dateField] as string)) return campaign

  if (campaign.status === 'DRAFT') {
    const { items } = await dbQuery<Campaign>({
      TableName: process.env.CAMPAIGNS_TABLE!,
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#s = :s',
      FilterExpression: 'attribute_not_exists(deletedAt)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'ACTIVE' },
    })
    if (items.some(c => c.campaignId !== campaign.campaignId)) return campaign
  }

  try {
    await db.send(new UpdateCommand({
      TableName: process.env.CAMPAIGNS_TABLE!,
      Key: { campaignId: campaign.campaignId },
      UpdateExpression: 'SET #s = :next, updatedAt = :now',
      ConditionExpression: '#s = :current',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':next': rule.next, ':current': campaign.status, ':now': now },
    }))

    await publishEvent(rule.eventType, {
      campaignId: campaign.campaignId,
      campaignName: campaign.name,
      status: rule.next,
      panelMemberIds: campaign.panelMemberIds,
      timestamp: now,
    })

    const updated = { ...campaign, status: rule.next, updatedAt: now }
    return checkAndTransition(updated)
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return campaign
    throw err
  }
}
