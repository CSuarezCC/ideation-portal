import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign, User } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.id
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } })
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')

  const members = await Promise.all(
    campaign.panelMemberIds.map(userId => dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId } }))
  )

  return successResponse({ items: members.filter(Boolean) })
}
