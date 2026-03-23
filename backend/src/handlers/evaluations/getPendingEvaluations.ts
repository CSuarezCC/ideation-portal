import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  const auth = getAuthContext(event)
  const campaign = await campaignRepository.getById(campaignId)
  if (!campaign || !campaign.panelMemberIds.includes(auth.userId)) return errorResponse('NOT_PANEL_MEMBER', 'Not assigned to this campaign')
  const [ideasResult, evalsResult] = await Promise.all([ideaRepository.listByCampaign(campaignId), evaluationRepository.listByPanelMember(auth.userId)])
  const submittedSet = new Set(evalsResult.items.filter(e => e.campaignId === campaignId && e.status === 'SUBMITTED').map(e => e.ideaId))
  const pending = ideasResult.items.filter(i => i.status !== 'DRAFT' && !submittedSet.has(i.ideaId)).sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))
  return successResponse(pending)
}
