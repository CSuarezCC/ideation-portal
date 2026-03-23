import { ulid } from 'ulid'
import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Category } from '../shared/types/index.js'
import { dbPut, dbQuery } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole, getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function createCategoryHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { name, description } = body

  if (!name || name.length < 2 || name.length > 100) return errorResponse('VALIDATION_ERROR', 'Name must be 2-100 characters')
  if (description && description.length > 500) return errorResponse('VALIDATION_ERROR', 'Description must be max 500 characters')

  // Check uniqueness among active categories
  const { items } = await dbQuery<Category>({
    TableName: process.env.CATEGORIES_TABLE!,
    IndexName: 'isActive-name-index',
    KeyConditionExpression: 'isActive = :a AND #n = :n',
    ExpressionAttributeNames: { '#n': 'name' },
    ExpressionAttributeValues: { ':a': 'true', ':n': name },
  })
  if (items.length > 0) return errorResponse('CATEGORY_NAME_EXISTS', 'An active category with this name already exists')

  const auth = getAuthContext(event)
  const now = new Date().toISOString()
  const category = {
    categoryId: ulid(),
    name,
    description: description || undefined,
    isActive: 'true',
    createdBy: auth.userId,
    createdAt: now,
    updatedAt: now,
  }

  await dbPut({ TableName: process.env.CATEGORIES_TABLE!, Item: category })
  return successResponse(category, 201)
}

export const handler = requireRole('ADMIN', createCategoryHandler)
