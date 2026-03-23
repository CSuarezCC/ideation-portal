import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, User } from '../../shared/types/index.js'
import { dbScan } from '../../shared/db/dynamoClient.js'
import { successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function listUsersHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const role = event.queryStringParameters?.role
  const status = event.queryStringParameters?.status

  const filters: string[] = []
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}

  if (role) { filters.push('#r = :role'); names['#r'] = 'role'; values[':role'] = role }
  if (status) { filters.push('#s = :status'); names['#s'] = 'status'; values[':status'] = status }

  const params: any = { TableName: process.env.USERS_TABLE! }
  if (filters.length > 0) {
    params.FilterExpression = filters.join(' AND ')
    params.ExpressionAttributeNames = names
    params.ExpressionAttributeValues = values
  }

  const { items } = await dbScan<User>(params)
  return successResponse({ items })
}

export const handler = requireRole('ADMIN', listUsersHandler)
