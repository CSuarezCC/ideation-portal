import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, Evaluation } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const auth = getAuthContext(event)

  const aggregated = await dbGet<AggregatedScore>({
    TableName: process.env.AGGREGATED_SCORES_TABLE!,
    Key: { ideaId },
  })

  if (!aggregated) return successResponse({ status: 'PENDING', ideaId })

  // Admin always sees full summary
  if (auth.role === 'ADMIN') {
    return successResponse({ status: 'COMPLETE', ...aggregated })
  }

  // Panel member: check blind scoring
  const myEval = await dbGet<Evaluation>({
    TableName: process.env.EVALUATIONS_TABLE!,
    Key: { ideaId, panelMemberId: auth.userId },
  })

  if (myEval?.status === 'SUBMITTED') {
    return successResponse({ status: 'COMPLETE', ...aggregated })
  }

  // Blind: return averages only, no individual breakdown
  const { evaluations, ...averages } = aggregated
  return successResponse({ status: 'BLIND', ...averages })
}
