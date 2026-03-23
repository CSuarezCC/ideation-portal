import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Evaluation } from '../../shared/types/index.js'
import { evaluationRepository } from '../../repositories/evaluationRepository.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { evaluationService } from '../../services/evaluationService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
import { publishEvent } from '../../shared/events/eventBridgeClient.js'
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
  const validationError = evaluationService.validateStrictScores(body)
  if (validationError) return errorResponse('EVALUATION_VALIDATION_ERROR', validationError)
  const now = new Date().toISOString()
  const evaluation: Evaluation = {
    ideaId, panelMemberId: auth.userId, campaignId: idea.campaignId, status: 'SUBMITTED',
    feasibilityScore: body.feasibilityScore, impactScore: body.impactScore, innovationScore: body.innovationScore,
    feasibilityJustification: body.feasibilityJustification.trim(),
    impactJustification: body.impactJustification.trim(),
    innovationJustification: body.innovationJustification.trim(),
    createdAt: existing?.createdAt ?? now, updatedAt: now, submittedAt: now,
  }
  await evaluationRepository.save(evaluation)
  await publishEvent('EvaluationSubmitted', { ideaId, campaignId: idea.campaignId, panelMemberId: auth.userId, timestamp: now })
  await evaluationService.checkAndAggregate(ideaId, idea.campaignId, campaign.panelMemberIds.length)
  return successResponse(evaluation)
}
