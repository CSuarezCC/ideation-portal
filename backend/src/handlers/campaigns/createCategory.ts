import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { categoryService } from '../../services/categoryService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole, getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
async function createCategoryHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { name, description } = body
  if (!name || name.length < 2 || name.length > 100) return errorResponse('VALIDATION_ERROR', 'Name must be 2-100 characters')
  if (description && description.length > 500) return errorResponse('VALIDATION_ERROR', 'Description must be max 500 characters')
  if (await categoryService.isNameTaken(name)) return errorResponse('CATEGORY_NAME_EXISTS', 'An active category with this name already exists')
  const auth = getAuthContext(event)
  const category = await categoryService.create(name, description, auth.userId)
  return successResponse(category, 201)
}
export const handler = requireRole('ADMIN', createCategoryHandler)
