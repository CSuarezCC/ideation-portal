import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Notification } from '../shared/types/index.js'
import { dbQuery } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  const nextPageToken = event.queryStringParameters?.nextPageToken

  const params: any = {
    TableName: process.env.NOTIFICATIONS_TABLE!,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': auth.userId },
    ScanIndexForward: false,
    Limit: 20,
  }

  if (nextPageToken) {
    try {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(nextPageToken, 'base64').toString())
    } catch { return errorResponse('VALIDATION_ERROR', 'Invalid nextPageToken') }
  }

  const result = await dbQuery<Notification>(params)

  return successResponse({
    notifications: result.items,
    nextPageToken: result.lastKey ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64') : null,
  })
}
