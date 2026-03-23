import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, ParticipationMetrics } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext, hasRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  if (!hasRole(auth.role, 'PANEL_MEMBER')) return errorResponse('ANALYTICS_ACCESS_DENIED', 'Analytics requires Panel Member or Admin role')
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  const [{ items: ideas }, { items: scores }, campaign] = await Promise.all([ideaRepository.listByCampaign(campaignId), evaluationRepository.listScoresByCampaign(campaignId), campaignRepository.getById(campaignId)])
  const totalSubmitted = ideas.length
  const totalEvaluated = scores.length
  const avgComposite = totalEvaluated > 0 ? scores.reduce((sum, s) => sum + s.compositeScore, 0) / totalEvaluated : 0
  const metrics: ParticipationMetrics = { campaignId, totalIdeasSubmitted: totalSubmitted, totalIdeasEvaluated: totalEvaluated, totalIdeasPending: totalSubmitted - totalEvaluated, totalPanelMembers: campaign?.panelMemberIds?.length ?? 0, averageCompositeScore: +avgComposite.toFixed(2) }
  return successResponse(metrics)
}
