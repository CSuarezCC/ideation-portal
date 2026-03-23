import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Idea, Campaign, Category } from '../shared/types/index.js'
import { dbGet, dbQuery } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.id
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId } })
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')

  const auth = getAuthContext(event)
  if (idea.submitterId !== auth.userId) return errorResponse('IDEA_NOT_OWNER', 'Not the idea owner')
  if (idea.status !== 'DRAFT') return errorResponse('IDEA_NOT_DRAFT', 'Only drafts can be submitted')

  // Validate required fields
  if (!idea.title || idea.title.length < 5) return errorResponse('IDEA_VALIDATION_ERROR', 'Title must be at least 5 characters')
  if (!idea.description || idea.description.length < 20) return errorResponse('IDEA_VALIDATION_ERROR', 'Description must be at least 20 characters')
  if (!idea.solution || idea.solution.length < 20) return errorResponse('IDEA_VALIDATION_ERROR', 'Solution must be at least 20 characters')
  if (!idea.benefits || idea.benefits.length < 10) return errorResponse('IDEA_VALIDATION_ERROR', 'Benefits must be at least 10 characters')
  if (!idea.categoryIds || idea.categoryIds.length === 0) return errorResponse('IDEA_VALIDATION_ERROR', 'At least one category is required')

  // Verify active campaign
  const { items: activeCampaigns } = await dbQuery<Campaign>({
    TableName: process.env.CAMPAIGNS_TABLE!,
    IndexName: 'status-createdAt-index',
    KeyConditionExpression: '#s = :s',
    FilterExpression: 'attribute_not_exists(deletedAt)',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': 'ACTIVE' },
    Limit: 1,
  })
  if (activeCampaigns.length === 0) return errorResponse('NO_ACTIVE_CAMPAIGN', 'No active campaign to submit to')

  const campaign = activeCampaigns[0]
  const now = new Date().toISOString()

  await db.send(new UpdateCommand({
    TableName: process.env.IDEAS_TABLE!,
    Key: { ideaId },
    UpdateExpression: 'SET #s = :s, campaignId = :c, submittedAt = :now, updatedAt = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': 'SUBMITTED', ':c': campaign.campaignId, ':now': now },
  }))

  await publishEvent('IdeaSubmitted', {
    ideaId, title: idea.title, submitterId: auth.userId,
    campaignId: campaign.campaignId, timestamp: now,
  })

  return successResponse({ ...idea, status: 'SUBMITTED', campaignId: campaign.campaignId, submittedAt: now, updatedAt: now })
}
