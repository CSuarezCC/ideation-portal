import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Category } from '../shared/types/index.js'
import { dbGet, dbQuery } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function updateCategoryHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const categoryId = event.pathParameters?.categoryId
  if (!categoryId) return errorResponse('VALIDATION_ERROR', 'Category ID is required')

  const category = await dbGet<Category>({ TableName: process.env.CATEGORIES_TABLE!, Key: { categoryId } })
  if (!category) return errorResponse('CATEGORY_NOT_FOUND', 'Category not found')

  const body = JSON.parse(event.body || '{}')
  const { name, description } = body

  if (name !== undefined && (name.length < 2 || name.length > 100)) return errorResponse('VALIDATION_ERROR', 'Name must be 2-100 characters')
  if (description !== undefined && description.length > 500) return errorResponse('VALIDATION_ERROR', 'Description must be max 500 characters')

  // Check name uniqueness if name changed
  if (name && name !== category.name && category.isActive === 'true') {
    const { items } = await dbQuery<Category>({
      TableName: process.env.CATEGORIES_TABLE!,
      IndexName: 'isActive-name-index',
      KeyConditionExpression: 'isActive = :a AND #n = :n',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: { ':a': 'true', ':n': name },
    })
    if (items.length > 0) return errorResponse('CATEGORY_NAME_EXISTS', 'An active category with this name already exists')
  }

  const now = new Date().toISOString()
  await db.send(new UpdateCommand({
    TableName: process.env.CATEGORIES_TABLE!,
    Key: { categoryId },
    UpdateExpression: 'SET #n = :n, description = :d, updatedAt = :now',
    ExpressionAttributeNames: { '#n': 'name' },
    ExpressionAttributeValues: {
      ':n': name ?? category.name,
      ':d': description ?? category.description ?? null,
      ':now': now,
    },
  }))

  return successResponse({ ...category, name: name ?? category.name, description: description ?? category.description, updatedAt: now })
}

export const handler = requireRole('ADMIN', updateCategoryHandler)
