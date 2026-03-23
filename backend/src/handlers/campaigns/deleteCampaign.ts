import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { campaignService } from '../../services/campaignService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
async function deleteCampaignHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')
  const campaign = await campaignRepository.getById(campaignId)
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  if (campaign.status !== 'DRAFT') return errorResponse('CAMPAIGN_NOT_DRAFT', 'Only DRAFT campaigns can be deleted')
  await campaignService.softDelete(campaignId)
  return successResponse({ message: 'Campaign deleted' })
}
export const handler = requireRole('ADMIN', deleteCampaignHandler)
