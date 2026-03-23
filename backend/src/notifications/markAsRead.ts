import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../shared/types/index.js'
import { dbUpdate } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  const notificationId = event.pathParameters?.notificationId
  if (!notificationId) return errorResponse('VALIDATION_ERROR', 'Notification ID is required')

  try {
    await dbUpdate({
      TableName: process.env.NOTIFICATIONS_TABLE!,
      Key: { userId: auth.userId, notificationId },
      UpdateExpression: 'SET isRead = :true',
      ConditionExpression: 'attribute_exists(notificationId)',
      ExpressionAttributeValues: { ':true': true },
    })
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') return errorResponse('NOTIFICATION_NOT_FOUND', 'Notification not found')
    throw err
  }

  return successResponse({ success: true })
}
