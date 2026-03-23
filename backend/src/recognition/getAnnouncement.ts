import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, WinnerAnnouncement } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  getAuthContext(event)
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  const announcement = await dbGet<WinnerAnnouncement>({
    TableName: process.env.WINNERS_TABLE!,
    Key: { campaignId, rank: 0 },
  })

  if (!announcement || !announcement.publishedAt) return errorResponse('RECOGNITION_NOT_FOUND', 'No announcement found')
  return successResponse(announcement)
}
