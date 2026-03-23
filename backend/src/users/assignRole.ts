import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider'
import type { ApiGatewayAuthorizerContext, Role } from '../shared/types/index.js'
import { dbGet, dbUpdate } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'
import type { User } from '../shared/types/index.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })
const VALID_ROLES: Role[] = ['EMPLOYEE', 'PANEL_MEMBER', 'ADMIN']

async function assignRoleHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  try {
    const requestingAdmin = event.requestContext.authorizer.lambda
    const targetUserId = event.pathParameters?.userId
    const { role } = JSON.parse(event.body ?? '{}')

    if (!targetUserId) return errorResponse('VALIDATION_ERROR', 'userId is required')
    if (!role || !VALID_ROLES.includes(role)) return errorResponse('VALIDATION_ERROR', `role must be one of: ${VALID_ROLES.join(', ')}`)
    if (targetUserId === requestingAdmin.userId) return errorResponse('VALIDATION_ERROR', 'Cannot change your own role')

    const user = await dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId: targetUserId } })
    if (!user) return errorResponse('USER_NOT_FOUND', 'User not found')

    // Update Cognito attribute
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: user.email,
      UserAttributes: [{ Name: 'custom:role', Value: role }],
    }))

    // Update DynamoDB
    await dbUpdate({
      TableName: process.env.USERS_TABLE!,
      Key: { userId: targetUserId },
      UpdateExpression: 'SET #role = :role, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': role, ':updatedAt': new Date().toISOString() },
    })

    return successResponse({ success: true })
  } catch (err) {
    console.error('Assign role error:', err)
    return errorResponse('INTERNAL_ERROR', 'Failed to assign role')
  }
}

export const handler = requireRole('ADMIN', assignRoleHandler)
