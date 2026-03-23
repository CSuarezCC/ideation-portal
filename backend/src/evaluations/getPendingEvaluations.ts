import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Idea, Evaluation, Campaign } from '../shared/types/index.js'
import { dbGet, dbQuery } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  const auth = getAuthContext(event)

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } })
  if (!campaign || !campaign.panelMemberIds.includes(auth.userId)) return errorResponse('NOT_PANEL_MEMBER', 'Not assigned to this campaign')

  const [ideasResult, evalsResult] = await Promise.all([
    dbQuery<Idea>({
      TableName: process.env.IDEAS_TABLE!,
      IndexName: 'campaignId-status-index',
      KeyConditionExpression: 'campaignId = :c',
      ExpressionAttributeValues: { ':c': campaignId },
    }),
    dbQuery<Evaluation>({
      TableName: process.env.EVALUATIONS_TABLE!,
      IndexName: 'panelMemberId-index',
      KeyConditionExpression: 'panelMemberId = :pm',
      ExpressionAttributeValues: { ':pm': auth.userId },
    }),
  ])

  const submittedSet = new Set(evalsResult.items.filter(e => e.campaignId === campaignId && e.status === 'SUBMITTED').map(e => e.ideaId))

  const pending = ideasResult.items
    .filter(i => i.status !== 'DRAFT' && !submittedSet.has(i.ideaId))
    .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))

  return successResponse(pending)
}
