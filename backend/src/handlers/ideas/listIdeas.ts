import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId query parameter is required')
  const status = event.queryStringParameters?.status
  const auth = getAuthContext(event)
  const { items } = await ideaRepository.listByCampaignAndStatus(campaignId, status)
  const visible = items.filter(idea => {
    if (idea.submitterId === auth.userId) return true
    if (auth.role === 'ADMIN' || auth.role === 'PANEL_MEMBER') return true
    if (idea.status === 'EVALUATED' || idea.status === 'WINNER') return true
    return false
  })
  return successResponse({ items: visible })
}
