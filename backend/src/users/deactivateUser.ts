import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, AdminDisableUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import type { ApiGatewayAuthorizerContext } from '../shared/types/index.js'
import { dbGet, dbUpdate } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'
import type { User } from '../shared/types/index.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

async function deactivateUserHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  try {
    const requestingAdmin = event.requestContext.authorizer.lambda
    const targetUserId = event.pathParameters?.userId

    if (!targetUserId) return errorResponse('VALIDATION_ERROR', 'userId is required')
    if (targetUserId === requestingAdmin.userId) return errorResponse('VALIDATION_ERROR', 'Cannot deactivate your own account')

    const user = await dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId: targetUserId } })
    if (!user) return errorResponse('USER_NOT_FOUND', 'User not found')

    await cognito.send(new AdminDisableUserCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: user.email,
    }))

    await dbUpdate({
      TableName: process.env.USERS_TABLE!,
      Key: { userId: targetUserId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'INACTIVE', ':updatedAt': new Date().toISOString() },
    })

    return successResponse({ success: true })
  } catch (err) {
    console.error('Deactivate user error:', err)
    return errorResponse('INTERNAL_ERROR', 'Failed to deactivate user')
  }
}

export const handler = requireRole('ADMIN', deactivateUserHandler)
