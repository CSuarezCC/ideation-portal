import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { campaignRepository } from '../../repositories/campaignRepository.js'
import { userRepository } from '../../repositories/userRepository.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')
  const campaign = await campaignRepository.getById(campaignId)
  if (!campaign) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  const members = await Promise.all(campaign.panelMemberIds.map(id => userRepository.getById(id)))
  return successResponse(members.filter(Boolean).map(u => ({ userId: u!.userId, name: u!.name, email: u!.email })))
}
