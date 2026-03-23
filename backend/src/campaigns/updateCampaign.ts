import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Campaign } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function updateCampaignHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.id
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'Campaign ID is required')

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } })
  if (!campaign || campaign.deletedAt) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  if (campaign.status !== 'DRAFT') return errorResponse('CAMPAIGN_NOT_DRAFT', 'Campaign can only be edited in DRAFT status')

  const body = JSON.parse(event.body || '{}')
  const { name, description, submissionStartDate, submissionEndDate, evaluationStartDate, evaluationEndDate } = body

  const updated = {
    name: name ?? campaign.name,
    description: description ?? campaign.description,
    submissionStartDate: submissionStartDate ?? campaign.submissionStartDate,
    submissionEndDate: submissionEndDate ?? campaign.submissionEndDate,
    evaluationStartDate: evaluationStartDate ?? campaign.evaluationStartDate,
    evaluationEndDate: evaluationEndDate ?? campaign.evaluationEndDate,
  }

  if (!(updated.submissionStartDate < updated.submissionEndDate && updated.submissionEndDate <= updated.evaluationStartDate && updated.evaluationStartDate < updated.evaluationEndDate)) {
    return errorResponse('VALIDATION_ERROR', 'Dates must be in order: submissionStart < submissionEnd <= evaluationStart < evaluationEnd')
  }

  const now = new Date().toISOString()
  await db.send(new UpdateCommand({
    TableName: process.env.CAMPAIGNS_TABLE!,
    Key: { campaignId },
    UpdateExpression: 'SET #n = :n, description = :d, submissionStartDate = :ssd, submissionEndDate = :sed, evaluationStartDate = :esd, evaluationEndDate = :eed, updatedAt = :now',
    ExpressionAttributeNames: { '#n': 'name' },
    ExpressionAttributeValues: {
      ':n': updated.name, ':d': updated.description,
      ':ssd': updated.submissionStartDate, ':sed': updated.submissionEndDate,
      ':esd': updated.evaluationStartDate, ':eed': updated.evaluationEndDate,
      ':now': now,
    },
  }))

  return successResponse({ ...campaign, ...updated, updatedAt: now })
}

export const handler = requireRole('ADMIN', updateCampaignHandler)
