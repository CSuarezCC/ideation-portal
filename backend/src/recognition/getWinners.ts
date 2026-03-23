import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, WinnerRecord } from '../shared/types/index.js'
import { dbQuery } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  getAuthContext(event)
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  const { items } = await dbQuery<WinnerRecord>({
    TableName: process.env.WINNERS_TABLE!,
    KeyConditionExpression: 'campaignId = :cid AND #r BETWEEN :one AND :three',
    ExpressionAttributeNames: { '#r': 'rank' },
    ExpressionAttributeValues: { ':cid': campaignId, ':one': 1, ':three': 3 },
  })

  // Hide winners until announced
  const announced = items.filter(w => w.announcedAt !== null)
  return successResponse(announced)
}
