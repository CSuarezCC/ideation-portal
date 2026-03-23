import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { recognitionService } from '../../services/recognitionService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
async function announceWinnersHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  const result = await recognitionService.announce(campaignId)
  if ('error' in result) return errorResponse(result.error!, result.error === 'CAMPAIGN_NOT_FOUND' ? 'Campaign not found' : result.error === 'CAMPAIGN_NOT_CLOSED' ? 'Campaign must be in CLOSED status' : result.error === 'RECOGNITION_NOT_FOUND' ? 'No winners determined yet' : 'Winners already announced')
  return successResponse({ message: 'Winners announced', campaignId })
}
export const handler = requireRole('ADMIN', announceWinnersHandler)
