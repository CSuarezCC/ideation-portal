import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { categoryRepository } from '../../repositories/categoryRepository.js'
import { categoryService } from '../../services/categoryService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
async function updateCategoryHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const categoryId = event.pathParameters?.categoryId
  if (!categoryId) return errorResponse('VALIDATION_ERROR', 'Category ID is required')
  const category = await categoryRepository.getById(categoryId)
  if (!category) return errorResponse('CATEGORY_NOT_FOUND', 'Category not found')
  const body = JSON.parse(event.body || '{}')
  const { name, description } = body
  if (name !== undefined && (name.length < 2 || name.length > 100)) return errorResponse('VALIDATION_ERROR', 'Name must be 2-100 characters')
  if (description !== undefined && description.length > 500) return errorResponse('VALIDATION_ERROR', 'Description must be max 500 characters')
  if (name && name !== category.name && category.isActive === 'true') {
    if (await categoryService.isNameTaken(name, categoryId)) return errorResponse('CATEGORY_NAME_EXISTS', 'An active category with this name already exists')
  }
  await categoryService.update(categoryId, { name, description })
  return successResponse({ ...category, name: name ?? category.name, description: description ?? category.description, updatedAt: new Date().toISOString() })
}
export const handler = requireRole('ADMIN', updateCategoryHandler)
