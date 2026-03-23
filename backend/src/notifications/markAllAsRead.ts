import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Notification } from '../shared/types/index.js'
import { dbQuery, dbUpdate } from '../shared/db/dynamoClient.js'
import { successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)

  const { items: unread } = await dbQuery<Notification>({
    TableName: process.env.NOTIFICATIONS_TABLE!,
    KeyConditionExpression: 'userId = :uid',
    FilterExpression: 'isRead = :false',
    ExpressionAttributeValues: { ':uid': auth.userId, ':false': false },
  })

  await Promise.all(unread.map(n =>
    dbUpdate({
      TableName: process.env.NOTIFICATIONS_TABLE!,
      Key: { userId: auth.userId, notificationId: n.notificationId },
      UpdateExpression: 'SET isRead = :true',
      ExpressionAttributeValues: { ':true': true },
    })
  ))

  return successResponse({ markedCount: unread.length })
}
