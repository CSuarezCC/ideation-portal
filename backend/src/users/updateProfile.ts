import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../shared/types/index.js'
import { dbUpdate } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  try {
    const { userId } = event.requestContext.authorizer.lambda
    const { name, department, avatarUrl } = JSON.parse(event.body ?? '{}')

    const updates: string[] = []
    const values: Record<string, unknown> = {}

    if (name !== undefined) { updates.push('name = :name'); values[':name'] = name }
    if (department !== undefined) { updates.push('department = :department'); values[':department'] = department }
    if (avatarUrl !== undefined) { updates.push('avatarUrl = :avatarUrl'); values[':avatarUrl'] = avatarUrl }

    if (updates.length === 0) return errorResponse('VALIDATION_ERROR', 'No fields to update')

    const now = new Date().toISOString()
    updates.push('updatedAt = :updatedAt')
    values[':updatedAt'] = now

    await dbUpdate({
      TableName: process.env.USERS_TABLE!,
      Key: { userId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
    })

    return successResponse({ success: true, updatedAt: now })
  } catch (err) {
    console.error('Update profile error:', err)
    return errorResponse('INTERNAL_ERROR', 'Failed to update profile')
  }
}
