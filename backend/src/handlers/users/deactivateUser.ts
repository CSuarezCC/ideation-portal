import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { userRepository } from '../../repositories/userRepository.js'
import { CognitoIdentityProviderClient, AdminDisableUserCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

async function deactivateUserHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const userId = event.pathParameters?.userId
  if (!userId) return errorResponse('VALIDATION_ERROR', 'User ID is required')

  const user = await userRepository.getById(userId)
  if (!user) return errorResponse('USER_NOT_FOUND', 'User not found')

  const cognitoUsers = await cognito.send(new ListUsersCommand({ UserPoolId: process.env.USER_POOL_ID!, Filter: `email = "${user.email}"`, Limit: 1 }))
  const cognitoUser = cognitoUsers.Users?.[0]
  if (cognitoUser) {
    await cognito.send(new AdminDisableUserCommand({ UserPoolId: process.env.USER_POOL_ID!, Username: cognitoUser.Username! }))
  }

  await userRepository.deactivate(userId)
  return successResponse({ ...user, status: 'INACTIVE' })
}

export const handler = requireRole('ADMIN', deactivateUserHandler)
