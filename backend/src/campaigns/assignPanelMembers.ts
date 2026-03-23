import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign, User } from '../shared/types/index.js'
import { dbGet, dbQuery } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function assignPanelMembersHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.id
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')

  const body = JSON.parse(event.body || '{}')
  const { userIds } = body as { userIds: string[] }
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'userIds array is required')
  }

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } })
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')

  // Validate all users exist and have PanelMember or Admin role
  for (const userId of userIds) {
    const user = await dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId } })
    if (!user || (user.role !== 'PANEL_MEMBER' && user.role !== 'ADMIN')) {
      return errorResponse('INVALID_PANEL_MEMBER', `User ${userId} is not a Panel Member or Admin`)
    }
  }

  const now = new Date().toISOString()
  await db.send(new UpdateCommand({
    TableName: process.env.CAMPAIGNS_TABLE!,
    Key: { campaignId },
    UpdateExpression: 'SET panelMemberIds = :ids, updatedAt = :now',
    ExpressionAttributeValues: { ':ids': userIds, ':now': now },
  }))

  return successResponse({ ...campaign, panelMemberIds: userIds, updatedAt: now })
}

export const handler = requireRole('ADMIN', assignPanelMembersHandler)
