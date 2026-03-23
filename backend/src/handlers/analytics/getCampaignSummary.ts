import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, CampaignSummaryData, TopIdea, ScoreDistribution } from '../../shared/types/index.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { userRepository } from '../../repositories/userRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext, hasRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
const BUCKET_RANGES: [string, number, number][] = [['1-2', 1, 2], ['3-4', 3, 4], ['5-6', 5, 6], ['7-8', 7, 8], ['9-10', 9, 10]]
const DIMENSIONS = ['composite', 'feasibility', 'impact', 'innovation'] as const
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  if (!hasRole(auth.role, 'PANEL_MEMBER')) return errorResponse('ANALYTICS_ACCESS_DENIED', 'Analytics requires Panel Member or Admin role')
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  const [campaign, { items: scores }, { items: ideas }] = await Promise.all([campaignRepository.getById(campaignId), evaluationRepository.listScoresByCampaign(campaignId), ideaRepository.listByCampaign(campaignId)])
  if (!campaign) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  const totalSubmitted = ideas.length
  const totalEvaluated = scores.length
  const avgComposite = totalEvaluated > 0 ? scores.reduce((sum, s) => sum + s.compositeScore, 0) / totalEvaluated : 0
  const topScores = scores.slice(0, 5)
  const topIdeas: TopIdea[] = await Promise.all(topScores.map(async (s) => {
    const idea = await ideaRepository.getById(s.ideaId)
    const user = idea?.submitterId ? await userRepository.getById(idea.submitterId) : undefined
    return { ideaId: s.ideaId, title: idea?.title ?? 'Unknown', submitterName: user?.name ?? 'Anonymous', compositeScore: s.compositeScore, feasibilityAvg: s.feasibilityAvg, impactAvg: s.impactAvg, innovationAvg: s.innovationAvg, totalEvaluations: s.totalEvaluations }
  }))
  const scoreDistributions: ScoreDistribution[] = DIMENSIONS.map(dim => {
    const key = dim === 'composite' ? 'compositeScore' : `${dim}Avg`
    return { campaignId, dimension: dim, buckets: BUCKET_RANGES.map(([rangeLabel, min, max]) => ({ rangeLabel, count: scores.filter(s => { const val = s[key as keyof AggregatedScore] as number; return val >= min && val <= max }).length })) }
  })
  const summary: CampaignSummaryData = { campaignId, campaignName: campaign.name, status: campaign.status, participation: { campaignId, totalIdeasSubmitted: totalSubmitted, totalIdeasEvaluated: totalEvaluated, totalIdeasPending: totalSubmitted - totalEvaluated, totalPanelMembers: campaign.panelMemberIds?.length ?? 0, averageCompositeScore: +avgComposite.toFixed(2) }, topIdeas, scoreDistributions }
  return successResponse(summary)
}
