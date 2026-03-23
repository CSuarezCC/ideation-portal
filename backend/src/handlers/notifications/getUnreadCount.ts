import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { notificationRepository } from '../../repositories/notificationRepository.js'
import { successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  const count = await notificationRepository.getUnreadCount(auth.userId)
  return successResponse({ count })
}
