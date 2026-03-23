import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { ideaService } from '../../services/ideaService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.id
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')
  const idea = await ideaRepository.getById(ideaId)
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')
  const auth = getAuthContext(event)
  if (idea.submitterId !== auth.userId) return errorResponse('IDEA_NOT_OWNER', 'Not the idea owner')
  if (idea.status !== 'DRAFT') return errorResponse('IDEA_NOT_DRAFT', 'Only drafts can be submitted')
  const validationError = ideaService.validateForSubmission(idea)
  if (validationError) return errorResponse('IDEA_VALIDATION_ERROR', validationError)
  const result = await ideaService.submit(idea, auth.userId)
  if ('error' in result) return errorResponse(result.error!, 'No active campaign to submit to')
  return successResponse({ ...idea, status: 'SUBMITTED', campaignId: result.campaign.campaignId, submittedAt: result.submittedAt, updatedAt: result.submittedAt })
}
