import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, IdeaDetail } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { userRepository } from '../../repositories/userRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')
  const auth = getAuthContext(event)
  const isEmployee = auth.role === 'EMPLOYEE'
  const [idea, aggregated] = await Promise.all([ideaRepository.getById(ideaId), evaluationRepository.getAggregatedScore(ideaId)])
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')
  const user = await userRepository.getById(idea.submitterId)
  const detail: IdeaDetail = {
    ideaId: idea.ideaId, title: idea.title, description: idea.description, solution: idea.solution, benefits: idea.benefits,
    categoryIds: idea.categoryIds, campaignId: idea.campaignId, status: idea.status, submittedAt: idea.submittedAt,
    submitterName: isEmployee ? null : (user?.name ?? 'Anonymous'),
    compositeScore: aggregated?.compositeScore ?? null, feasibilityAvg: aggregated?.feasibilityAvg ?? null,
    impactAvg: aggregated?.impactAvg ?? null, innovationAvg: aggregated?.innovationAvg ?? null,
    totalEvaluations: aggregated?.totalEvaluations ?? null, evaluations: isEmployee ? null : (aggregated?.evaluations ?? null),
  }
  return successResponse(detail)
}
