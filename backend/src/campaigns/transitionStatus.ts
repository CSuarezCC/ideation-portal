import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign, CampaignStatus } from '../shared/types/index.js'
import { dbGet, dbQuery } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const VALID_TRANSITIONS: Record<string, CampaignStatus> = {
  DRAFT: 'ACTIVE',
  ACTIVE: 'EVALUATION',
  EVALUATION: 'CLOSED',
}

const EVENT_TYPES: Record<string, string> = {
  ACTIVE: 'CampaignActivated',
  EVALUATION: 'CampaignEvaluationStarted',
  CLOSED: 'CampaignClosed',
}

async function transitionStatusHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.id
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } })
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')

  const nextStatus = VALID_TRANSITIONS[campaign.status]
  if (!nextStatus) return errorResponse('CAMPAIGN_INVALID_TRANSITION', `Cannot transition from ${campaign.status}`)

  if (nextStatus === 'ACTIVE') {
    const { items } = await dbQuery<Campaign>({
      TableName: process.env.CAMPAIGNS_TABLE!,
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#s = :s',
      FilterExpression: 'attribute_not_exists(deletedAt)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'ACTIVE' },
    })
    if (items.some(c => c.campaignId !== campaignId)) {
      return errorResponse('CAMPAIGN_ALREADY_ACTIVE', 'Another campaign is already active')
    }
  }

  if (nextStatus === 'EVALUATION' && (!campaign.panelMemberIds || campaign.panelMemberIds.length === 0)) {
    return errorResponse('CAMPAIGN_NO_PANEL_MEMBERS', 'At least one panel member must be assigned before evaluation')
  }

  const now = new Date().toISOString()
  await db.send(new UpdateCommand({
    TableName: process.env.CAMPAIGNS_TABLE!,
    Key: { campaignId },
    UpdateExpression: 'SET #s = :next, updatedAt = :now',
    ConditionExpression: '#s = :current',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':next': nextStatus, ':current': campaign.status, ':now': now },
  }))

  await publishEvent(EVENT_TYPES[nextStatus], {
    campaignId, campaignName: campaign.name, status: nextStatus,
    panelMemberIds: campaign.panelMemberIds, timestamp: now,
  })

  return successResponse({ ...campaign, status: nextStatus, updatedAt: now })
}

export const handler = requireRole('ADMIN', transitionStatusHandler)
