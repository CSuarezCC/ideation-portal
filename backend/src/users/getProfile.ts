import type { APIGatewayProxyResultV2 } from 'aws-lambda'
import type { APIGatewayProxyEventV2WithRequestContext } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import type { User } from '../shared/types/index.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  try {
    const { userId } = event.requestContext.authorizer.lambda
    const user = await dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId } })
    if (!user) return errorResponse('USER_NOT_FOUND', 'User not found')
    return successResponse(user)
  } catch (err) {
    console.error('Get profile error:', err)
    return errorResponse('INTERNAL_ERROR', 'Failed to retrieve profile')
  }
}
