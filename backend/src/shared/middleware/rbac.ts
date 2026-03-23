import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2, Context } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Role } from '../types/index.js'
import { errorResponse } from '../utils/errors.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
type AuthHandler = (event: AuthEvent, context: Context) => Promise<APIGatewayProxyResultV2>

const ROLE_HIERARCHY: Record<Role, number> = {
  EMPLOYEE: 1,
  PANEL_MEMBER: 2,
  ADMIN: 3,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function getAuthContext(event: AuthEvent): ApiGatewayAuthorizerContext {
  return event.requestContext.authorizer.lambda
}

export function requireRole(requiredRole: Role, handler: AuthHandler): AuthHandler {
  return async (event, context) => {
    const auth = getAuthContext(event)
    if (!hasRole(auth.role, requiredRole)) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions')
    }
    return handler(event, context)
  }
}
