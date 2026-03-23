import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { campaignService } from '../../services/campaignService.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { requireRole, getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
async function createCampaignHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { name, description, submissionStartDate, submissionEndDate, evaluationStartDate, evaluationEndDate } = body
  if (!name || name.length < 3) return errorResponse('VALIDATION_ERROR', 'Name must be at least 3 characters')
  if (!description) return errorResponse('VALIDATION_ERROR', 'Description is required')
  if (!submissionStartDate || !submissionEndDate || !evaluationStartDate || !evaluationEndDate) return errorResponse('VALIDATION_ERROR', 'All dates are required')
  if (new Date(submissionStartDate) >= new Date(submissionEndDate)) return errorResponse('VALIDATION_ERROR', 'Submission start must be before end')
  if (new Date(evaluationStartDate) >= new Date(evaluationEndDate)) return errorResponse('VALIDATION_ERROR', 'Evaluation start must be before end')
  const auth = getAuthContext(event)
  const campaign = await campaignService.create({ name, description, submissionStartDate, submissionEndDate, evaluationStartDate, evaluationEndDate }, auth.userId)
  return successResponse(campaign, 201)
}
export const handler = requireRole('ADMIN', createCampaignHandler)
