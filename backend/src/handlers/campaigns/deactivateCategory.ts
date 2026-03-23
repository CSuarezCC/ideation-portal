import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { categoryRepository } from '../../repositories/categoryRepository.js'
import { categoryService } from '../../services/categoryService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
async function deactivateCategoryHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const categoryId = event.pathParameters?.categoryId
  if (!categoryId) return errorResponse('VALIDATION_ERROR', 'Category ID is required')
  const category = await categoryRepository.getById(categoryId)
  if (!category) return errorResponse('CATEGORY_NOT_FOUND', 'Category not found')
  const newActive = await categoryService.toggleActive(categoryId, category.isActive)
  return successResponse({ ...category, isActive: newActive, updatedAt: new Date().toISOString() })
}
export const handler = requireRole('ADMIN', deactivateCategoryHandler)
