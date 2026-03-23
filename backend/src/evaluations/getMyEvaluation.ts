import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Evaluation } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const auth = getAuthContext(event)
  const evaluation = await dbGet<Evaluation>({
    TableName: process.env.EVALUATIONS_TABLE!,
    Key: { ideaId, panelMemberId: auth.userId },
  })

  return successResponse(evaluation ?? null)
}
