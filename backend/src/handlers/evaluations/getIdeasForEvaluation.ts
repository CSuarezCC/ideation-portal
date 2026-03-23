import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
const STATUS_ORDER = { NOT_STARTED: 0, IN_PROGRESS: 1, COMPLETED: 2 } as const
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  const auth = getAuthContext(event)
  const campaign = await campaignRepository.getById(campaignId)
  if (!campaign || !campaign.panelMemberIds.includes(auth.userId)) return errorResponse('NOT_PANEL_MEMBER', 'Not assigned to this campaign')
  if (campaign.status !== 'EVALUATION' && campaign.status !== 'CLOSED' && campaign.status !== 'ANNOUNCED') return errorResponse('CAMPAIGN_NOT_IN_EVALUATION', 'Campaign is not in evaluation phase')
  const [ideasResult, evalsResult] = await Promise.all([ideaRepository.listByCampaign(campaignId), evaluationRepository.listByPanelMember(auth.userId)])
  const evalMap = new Map(evalsResult.items.filter(e => e.campaignId === campaignId).map(e => [e.ideaId, e]))
  const ideas = ideasResult.items.filter(i => i.status !== 'DRAFT').map(idea => {
    const ev = evalMap.get(idea.ideaId)
    const evaluationStatus = ev?.status === 'SUBMITTED' ? 'COMPLETED' : ev ? 'IN_PROGRESS' : 'NOT_STARTED'
    return { ideaId: idea.ideaId, title: idea.title, description: idea.description, categoryIds: idea.categoryIds, submittedAt: idea.submittedAt, status: idea.status, evaluationStatus }
  }).sort((a, b) => STATUS_ORDER[a.evaluationStatus as keyof typeof STATUS_ORDER] - STATUS_ORDER[b.evaluationStatus as keyof typeof STATUS_ORDER] || (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))
  return successResponse(ideas)
}
