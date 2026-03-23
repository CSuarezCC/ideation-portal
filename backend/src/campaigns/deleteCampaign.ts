import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function deleteCampaignHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.id
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } })
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  if (campaign.status !== 'DRAFT') return errorResponse('CAMPAIGN_NOT_DRAFT', 'Only DRAFT campaigns can be deleted')

  const now = new Date().toISOString()
  await db.send(new UpdateCommand({
    TableName: process.env.CAMPAIGNS_TABLE!,
    Key: { campaignId },
    UpdateExpression: 'SET deletedAt = :now, updatedAt = :now',
    ExpressionAttributeValues: { ':now': now },
  }))

  return successResponse({ message: 'Campaign deleted' })
}

export const handler = requireRole('ADMIN', deleteCampaignHandler)
