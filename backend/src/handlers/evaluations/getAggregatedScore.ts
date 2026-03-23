import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')
  const aggregated = await evaluationRepository.getAggregatedScore(ideaId)
  if (!aggregated) return successResponse(null)
  const { evaluations, ...scores } = aggregated
  return successResponse(scores)
}
