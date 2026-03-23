import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Idea } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.id
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId } })
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')

  const auth = getAuthContext(event)

  // Visibility rules
  if (idea.submitterId === auth.userId) return successResponse(idea)
  if (auth.role === 'ADMIN' || auth.role === 'PANEL_MEMBER') return successResponse(idea)
  if (idea.status === 'EVALUATED' || idea.status === 'WINNER') return successResponse(idea)

  return errorResponse('FORBIDDEN', 'You do not have access to this idea')
}
