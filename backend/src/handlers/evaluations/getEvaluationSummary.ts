import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')
  const auth = getAuthContext(event)
  const aggregated = await evaluationRepository.getAggregatedScore(ideaId)
  if (!aggregated) return successResponse({ status: 'PENDING', ideaId })
  if (auth.role === 'ADMIN') return successResponse({ status: 'COMPLETE', ...aggregated })
  const myEval = await evaluationRepository.get(ideaId, auth.userId)
  if (myEval?.status === 'SUBMITTED') return successResponse({ status: 'COMPLETE', ...aggregated })
  const { evaluations, ...averages } = aggregated
  return successResponse({ status: 'BLIND', ...averages })
}
