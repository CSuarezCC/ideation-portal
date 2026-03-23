import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Category } from '../shared/types/index.js'
import { dbQuery, dbScan } from '../shared/db/dynamoClient.js'
import { successResponse } from '../shared/utils/errors.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const activeOnly = event.queryStringParameters?.activeOnly !== 'false'

  if (activeOnly) {
    const { items } = await dbQuery<Category>({
      TableName: process.env.CATEGORIES_TABLE!,
      IndexName: 'isActive-name-index',
      KeyConditionExpression: 'isActive = :a',
      ExpressionAttributeValues: { ':a': 'true' },
    })
    return successResponse({ items })
  }

  const { items } = await dbScan<Category>({ TableName: process.env.CATEGORIES_TABLE! })
  return successResponse({ items })
}
