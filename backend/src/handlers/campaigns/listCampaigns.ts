import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign } from '../../shared/types/index.js'
import { dbScan } from '../../shared/db/dynamoClient.js'
import { successResponse } from '../../shared/utils/errors.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const status = event.queryStringParameters?.status
  const params: any = { TableName: process.env.CAMPAIGNS_TABLE!, FilterExpression: 'attribute_not_exists(deletedAt)', ExpressionAttributeValues: {} as Record<string, unknown> }
  if (status) {
    params.FilterExpression += ' AND #s = :s'
    params.ExpressionAttributeNames = { '#s': 'status' }
    params.ExpressionAttributeValues[':s'] = status
  }
  if (Object.keys(params.ExpressionAttributeValues).length === 0) delete params.ExpressionAttributeValues
  const { items } = await dbScan<Campaign>(params)
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return successResponse({ items })
}
