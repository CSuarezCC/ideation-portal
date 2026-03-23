import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Role } from '../shared/types/index.js'
import { dbQuery, dbScan } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'
import type { User } from '../shared/types/index.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function listUsersHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  try {
    const roleFilter = event.queryStringParameters?.role as Role | undefined
    const pageSize = parseInt(event.queryStringParameters?.pageSize ?? '20', 10)
    const nextPageToken = event.queryStringParameters?.nextPageToken

    let result: { items: User[]; lastKey?: Record<string, unknown> }

    if (roleFilter) {
      result = await dbQuery<User>({
        TableName: process.env.USERS_TABLE!,
        IndexName: 'role-index',
        KeyConditionExpression: '#role = :role',
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': roleFilter },
        Limit: pageSize,
        ExclusiveStartKey: nextPageToken ? JSON.parse(Buffer.from(nextPageToken, 'base64').toString()) : undefined,
      })
    } else {
      result = await dbScan<User>({
        TableName: process.env.USERS_TABLE!,
        Limit: pageSize,
        ExclusiveStartKey: nextPageToken ? JSON.parse(Buffer.from(nextPageToken, 'base64').toString()) : undefined,
      })
    }

    return successResponse({
      users: result.items,
      nextPageToken: result.lastKey ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64') : undefined,
    })
  } catch (err) {
    console.error('List users error:', err)
    return errorResponse('INTERNAL_ERROR', 'Failed to list users')
  }
}

export const handler = requireRole('ADMIN', listUsersHandler)
