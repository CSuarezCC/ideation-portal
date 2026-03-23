import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { userRepository } from '../../repositories/userRepository.js'
import { campaignService } from '../../services/campaignService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
async function assignPanelMembersHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')
  const campaign = await campaignRepository.getById(campaignId)
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  const body = JSON.parse(event.body || '{}')
  const { panelMemberIds } = body
  if (!Array.isArray(panelMemberIds) || panelMemberIds.length === 0) return errorResponse('VALIDATION_ERROR', 'panelMemberIds must be a non-empty array')
  for (const id of panelMemberIds) {
    const user = await userRepository.getById(id)
    if (!user || (user.role !== 'PANEL_MEMBER' && user.role !== 'ADMIN')) return errorResponse('INVALID_PANEL_MEMBER', `User ${id} is not a panel member`)
  }
  await campaignService.assignPanelMembers(campaignId, panelMemberIds)
  return successResponse({ ...campaign, panelMemberIds })
}
export const handler = requireRole('ADMIN', assignPanelMembersHandler)
