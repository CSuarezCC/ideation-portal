import { ulid } from 'ulid'
import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../shared/types/index.js'
import { dbPut, dbQuery } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole, getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function createCampaignHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { name, description, submissionStartDate, submissionEndDate, evaluationStartDate, evaluationEndDate } = body

  if (!name || !description || !submissionStartDate || !submissionEndDate || !evaluationStartDate || !evaluationEndDate) {
    return errorResponse('VALIDATION_ERROR', 'All fields are required: name, description, submissionStartDate, submissionEndDate, evaluationStartDate, evaluationEndDate')
  }
  if (name.length < 3 || name.length > 200) return errorResponse('VALIDATION_ERROR', 'Name must be 3-200 characters')
  if (description.length < 10 || description.length > 2000) return errorResponse('VALIDATION_ERROR', 'Description must be 10-2000 characters')
  if (!(submissionStartDate < submissionEndDate && submissionEndDate <= evaluationStartDate && evaluationStartDate < evaluationEndDate)) {
    return errorResponse('VALIDATION_ERROR', 'Dates must be in order: submissionStart < submissionEnd <= evaluationStart < evaluationEnd')
  }

  const auth = getAuthContext(event)
  const now = new Date().toISOString()
  const campaign = {
    campaignId: ulid(),
    name, description, submissionStartDate, submissionEndDate, evaluationStartDate, evaluationEndDate,
    status: 'DRAFT' as const,
    panelMemberIds: [],
    createdBy: auth.userId,
    createdAt: now,
    updatedAt: now,
  }

  await dbPut({ TableName: process.env.CAMPAIGNS_TABLE!, Item: campaign })
  return successResponse(campaign, 201)
}

export const handler = requireRole('ADMIN', createCampaignHandler)
