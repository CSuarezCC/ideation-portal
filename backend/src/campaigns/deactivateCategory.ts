import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Category } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function deactivateCategoryHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const categoryId = event.pathParameters?.categoryId
  if (!categoryId) return errorResponse('VALIDATION_ERROR', 'Category ID is required')

  const category = await dbGet<Category>({ TableName: process.env.CATEGORIES_TABLE!, Key: { categoryId } })
  if (!category) return errorResponse('CATEGORY_NOT_FOUND', 'Category not found')

  const now = new Date().toISOString()
  const newActive = category.isActive === 'true' ? 'false' : 'true'

  await db.send(new UpdateCommand({
    TableName: process.env.CATEGORIES_TABLE!,
    Key: { categoryId },
    UpdateExpression: 'SET isActive = :a, updatedAt = :now',
    ExpressionAttributeValues: { ':a': newActive, ':now': now },
  }))

  return successResponse({ ...category, isActive: newActive, updatedAt: now })
}

export const handler = requireRole('ADMIN', deactivateCategoryHandler)
