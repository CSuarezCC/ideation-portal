import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { userRepository } from '../../repositories/userRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  const user = await userRepository.getById(auth.userId)
  if (!user) return errorResponse('USER_NOT_FOUND', 'User not found')

  const body = JSON.parse(event.body || '{}')
  const { name, department, avatarUrl } = body
  if (name !== undefined && (name.length < 2 || name.length > 100)) return errorResponse('VALIDATION_ERROR', 'Name must be 2-100 characters')

  await userRepository.update(auth.userId, { name, department, avatarUrl })
  return successResponse({ ...user, name: name ?? user.name, department: department ?? user.department, avatarUrl: avatarUrl ?? user.avatarUrl })
}
