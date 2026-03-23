import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { notificationRepository } from '../../repositories/notificationRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  const nextPageToken = event.queryStringParameters?.nextPageToken
  let startKey: Record<string, unknown> | undefined
  if (nextPageToken) {
    try { startKey = JSON.parse(Buffer.from(nextPageToken, 'base64').toString()) }
    catch { return errorResponse('VALIDATION_ERROR', 'Invalid nextPageToken') }
  }
  const result = await notificationRepository.listByUser(auth.userId, 20, startKey)
  return successResponse({ notifications: result.items, nextPageToken: result.lastKey ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64') : null })
}
