import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../shared/types/index.js'
import { db } from '../shared/db/dynamoClient.js'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)

  const result = await db.send(new QueryCommand({
    TableName: process.env.NOTIFICATIONS_TABLE!,
    KeyConditionExpression: 'userId = :uid',
    FilterExpression: 'isRead = :false',
    ExpressionAttributeValues: { ':uid': auth.userId, ':false': false },
    Select: 'COUNT',
  }))

  return successResponse({ count: result.Count ?? 0 })
}
