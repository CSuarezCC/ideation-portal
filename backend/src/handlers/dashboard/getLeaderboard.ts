import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, Idea, LeaderboardEntry } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { userRepository } from '../../repositories/userRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
const VALID_DIMENSIONS = ['composite', 'feasibility', 'impact', 'innovation', 'most_recent'] as const
type Dimension = (typeof VALID_DIMENSIONS)[number]
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  const dimension = (event.queryStringParameters?.dimension ?? 'composite') as Dimension
  if (!VALID_DIMENSIONS.includes(dimension)) return errorResponse('INVALID_DIMENSION', `Invalid dimension: ${dimension}`)
  const auth = getAuthContext(event)
  const isEmployee = auth.role === 'EMPLOYEE'
  if (dimension === 'most_recent') {
    const { items: ideas } = await ideaRepository.listByCampaign(campaignId)
    ideas.sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!))
    const scoreMap = new Map<string, AggregatedScore>()
    await Promise.all(ideas.map(async (idea) => { const s = await evaluationRepository.getAggregatedScore(idea.ideaId); if (s) scoreMap.set(idea.ideaId, s) }))
    return successResponse(await buildEntries(ideas, scoreMap, isEmployee))
  }
  const { items: scores } = await evaluationRepository.listScoresByCampaign(campaignId)
  if (dimension !== 'composite') { const key = `${dimension}Avg` as keyof AggregatedScore; scores.sort((a, b) => (b[key] as number) - (a[key] as number)) }
  const ideaMap = new Map<string, Idea>()
  await Promise.all(scores.map(async (s) => { const idea = await ideaRepository.getById(s.ideaId); if (idea) ideaMap.set(s.ideaId, idea) }))
  return successResponse(await buildEntriesFromScores(scores, ideaMap, isEmployee))
}
async function buildEntries(ideas: Idea[], scoreMap: Map<string, AggregatedScore>, isEmployee: boolean): Promise<LeaderboardEntry[]> {
  return Promise.all(ideas.map(async (idea) => {
    const score = scoreMap.get(idea.ideaId)
    const name = isEmployee ? null : await userRepository.getName(idea.submitterId)
    return { ideaId: idea.ideaId, title: idea.title, submitterName: name, submitterId: idea.submitterId, campaignId: idea.campaignId, categoryIds: idea.categoryIds, submittedAt: idea.submittedAt!, compositeScore: score?.compositeScore ?? null, feasibilityAvg: score?.feasibilityAvg ?? null, impactAvg: score?.impactAvg ?? null, innovationAvg: score?.innovationAvg ?? null, totalEvaluations: score?.totalEvaluations ?? null }
  }))
}
async function buildEntriesFromScores(scores: AggregatedScore[], ideaMap: Map<string, Idea>, isEmployee: boolean): Promise<LeaderboardEntry[]> {
  return Promise.all(scores.map(async (score) => {
    const idea = ideaMap.get(score.ideaId)
    const name = isEmployee ? null : await userRepository.getName(idea?.submitterId ?? '')
    return { ideaId: score.ideaId, title: idea?.title ?? 'Unknown', submitterName: name, submitterId: idea?.submitterId ?? '', campaignId: score.campaignId, categoryIds: idea?.categoryIds ?? [], submittedAt: idea?.submittedAt ?? '', compositeScore: score.compositeScore, feasibilityAvg: score.feasibilityAvg, impactAvg: score.impactAvg, innovationAvg: score.innovationAvg, totalEvaluations: score.totalEvaluations }
  }))
}
