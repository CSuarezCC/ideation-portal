import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Role } from '../../shared/types/index.js'
import { userRepository } from '../../repositories/userRepository.js'
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminListGroupsForUserCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })
const VALID_ROLES: Role[] = ['EMPLOYEE', 'PANEL_MEMBER', 'ADMIN']

async function assignRoleHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const userId = event.pathParameters?.userId
  if (!userId) return errorResponse('VALIDATION_ERROR', 'User ID is required')

  const body = JSON.parse(event.body || '{}')
  const { role } = body
  if (!role || !VALID_ROLES.includes(role)) return errorResponse('VALIDATION_ERROR', `Role must be one of: ${VALID_ROLES.join(', ')}`)

  const user = await userRepository.getById(userId)
  if (!user) return errorResponse('USER_NOT_FOUND', 'User not found')

  // Update Cognito groups
  const cognitoUsers = await cognito.send(new ListUsersCommand({ UserPoolId: process.env.USER_POOL_ID!, Filter: `email = "${user.email}"`, Limit: 1 }))
  const cognitoUser = cognitoUsers.Users?.[0]
  if (cognitoUser) {
    const groups = await cognito.send(new AdminListGroupsForUserCommand({ UserPoolId: process.env.USER_POOL_ID!, Username: cognitoUser.Username! }))
    for (const g of groups.Groups ?? []) {
      await cognito.send(new AdminRemoveUserFromGroupCommand({ UserPoolId: process.env.USER_POOL_ID!, Username: cognitoUser.Username!, GroupName: g.GroupName! }))
    }
    await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: process.env.USER_POOL_ID!, Username: cognitoUser.Username!, GroupName: role }))
  }

  await userRepository.setRole(userId, role)
  return successResponse({ ...user, role })
}

export const handler = requireRole('ADMIN', assignRoleHandler)
