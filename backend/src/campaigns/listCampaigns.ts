import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign } from '../shared/types/index.js'
import { dbQuery, dbScan } from '../shared/db/dynamoClient.js'
import { successResponse } from '../shared/utils/errors.js'
import { checkAndTransition } from './transitionEngine.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const status = event.queryStringParameters?.status

  let items: Campaign[]
  if (status) {
    const result = await dbQuery<Campaign>({
      TableName: process.env.CAMPAIGNS_TABLE!,
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#s = :s',
      FilterExpression: 'attribute_not_exists(deletedAt)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status },
      ScanIndexForward: false,
    })
    items = result.items
  } else {
    const result = await dbScan<Campaign>({
      TableName: process.env.CAMPAIGNS_TABLE!,
      FilterExpression: 'attribute_not_exists(deletedAt)',
    })
    items = result.items
  }

  const campaigns = await Promise.all(items.map(checkAndTransition))
  return successResponse({ items: campaigns })
}
