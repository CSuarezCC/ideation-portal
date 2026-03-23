import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Evaluation } from '../../shared/types/index.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { evaluationService } from '../../services/evaluationService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')
  const auth = getAuthContext(event)
  const body = JSON.parse(event.body || '{}')
  const existing = await evaluationRepository.get(ideaId, auth.userId)
  if (existing?.status === 'SUBMITTED') return errorResponse('EVALUATION_ALREADY_SUBMITTED', 'Evaluation already submitted')
  const idea = await ideaRepository.getById(ideaId)
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')
  const campaign = await campaignRepository.getById(idea.campaignId)
  if (!campaign || !campaign.panelMemberIds.includes(auth.userId)) return errorResponse('NOT_PANEL_MEMBER', 'Not assigned to this campaign')
  for (const key of ['feasibilityScore', 'impactScore', 'innovationScore'] as const) {
    if (!evaluationService.validateScore(body[key])) return errorResponse('EVALUATION_VALIDATION_ERROR', `${key} must be integer 1-10`)
  }
  const now = new Date().toISOString()
  const evaluation: Evaluation = {
    ideaId, panelMemberId: auth.userId, campaignId: idea.campaignId, status: 'DRAFT',
    feasibilityScore: body.feasibilityScore ?? existing?.feasibilityScore,
    impactScore: body.impactScore ?? existing?.impactScore,
    innovationScore: body.innovationScore ?? existing?.innovationScore,
    feasibilityJustification: body.feasibilityJustification ?? existing?.feasibilityJustification,
    impactJustification: body.impactJustification ?? existing?.impactJustification,
    innovationJustification: body.innovationJustification ?? existing?.innovationJustification,
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  }
  await evaluationRepository.save(evaluation)
  return successResponse(evaluation)
}
