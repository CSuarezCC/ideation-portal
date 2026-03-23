import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  const { items: scores } = await evaluationRepository.listScoresByCampaign(campaignId)
  const total = scores.length
  const highestComposite = total > 0 ? scores[0].compositeScore : 0
  const avgComposite = total > 0 ? scores.reduce((sum, s) => sum + s.compositeScore, 0) / total : 0
  return successResponse({ totalEvaluatedIdeas: total, highestCompositeScore: highestComposite, averageCompositeScore: +avgComposite.toFixed(2) })
}
