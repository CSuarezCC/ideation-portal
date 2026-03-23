import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Idea } from '../shared/types/index.js'
import { dbQuery } from '../shared/db/dynamoClient.js'
import { successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  const status = event.queryStringParameters?.status

  const params: any = {
    TableName: process.env.IDEAS_TABLE!,
    IndexName: 'submitterId-index',
    KeyConditionExpression: 'submitterId = :uid',
    ExpressionAttributeValues: { ':uid': auth.userId } as Record<string, unknown>,
  }

  if (status) {
    params.FilterExpression = '#s = :s'
    params.ExpressionAttributeNames = { '#s': 'status' }
    params.ExpressionAttributeValues[':s'] = status
  }

  const { items } = await dbQuery<Idea>(params)
  return successResponse({ items })
}
