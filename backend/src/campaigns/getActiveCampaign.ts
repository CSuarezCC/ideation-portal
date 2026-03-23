import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign } from '../shared/types/index.js'
import { dbQuery } from '../shared/db/dynamoClient.js'
import { successResponse } from '../shared/utils/errors.js'
import { checkAndTransition } from './transitionEngine.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const { items } = await dbQuery<Campaign>({
    TableName: process.env.CAMPAIGNS_TABLE!,
    IndexName: 'status-createdAt-index',
    KeyConditionExpression: '#s = :s',
    FilterExpression: 'attribute_not_exists(deletedAt)',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': 'ACTIVE' },
    Limit: 1,
  })

  if (!items.length) return successResponse(null)

  const campaign = await checkAndTransition(items[0])
  return successResponse(campaign.status === 'ACTIVE' ? campaign : null)
}
