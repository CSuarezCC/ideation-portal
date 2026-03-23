import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, CampaignStatus } from '../../shared/types/index.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { campaignService } from '../../services/campaignService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
const VALID_TRANSITIONS: Record<string, CampaignStatus[]> = {
  DRAFT: ['ACTIVE'], ACTIVE: ['EVALUATION'], EVALUATION: ['CLOSED'], CLOSED: ['ANNOUNCED'],
}
async function transitionStatusHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')
  const body = JSON.parse(event.body || '{}')
  const { targetStatus } = body
  if (!targetStatus) return errorResponse('VALIDATION_ERROR', 'targetStatus is required')
  const campaign = await campaignRepository.getById(campaignId)
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  const allowed = VALID_TRANSITIONS[campaign.status] ?? []
  if (!allowed.includes(targetStatus)) return errorResponse('CAMPAIGN_INVALID_TRANSITION', `Cannot transition from ${campaign.status} to ${targetStatus}`)
  if (targetStatus === 'ACTIVE') {
    const existing = await campaignRepository.getActive()
    if (existing && existing.campaignId !== campaignId) return errorResponse('CAMPAIGN_ALREADY_ACTIVE', 'Another campaign is already active')
    if (campaign.panelMemberIds.length === 0) return errorResponse('CAMPAIGN_NO_PANEL_MEMBERS', 'Assign panel members before activating')
  }
  await campaignService.transitionStatus(campaignId, targetStatus, campaign)
  return successResponse({ ...campaign, status: targetStatus })
}
export const handler = requireRole('ADMIN', transitionStatusHandler)
