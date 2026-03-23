import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, Idea, Campaign, ParticipationMetrics } from '../shared/types/index.js'
import { dbQuery, dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext, hasRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  if (!hasRole(auth.role, 'PANEL_MEMBER')) return errorResponse('ANALYTICS_ACCESS_DENIED', 'Analytics requires Panel Member or Admin role')

  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  const [{ items: ideas }, { items: scores }, campaign] = await Promise.all([
    dbQuery<Idea>({
      TableName: process.env.IDEAS_TABLE!,
      IndexName: 'campaignId-status-index',
      KeyConditionExpression: 'campaignId = :cid',
      FilterExpression: '#s <> :draft',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':cid': campaignId, ':draft': 'DRAFT' },
    }),
    dbQuery<AggregatedScore>({
      TableName: process.env.AGGREGATED_SCORES_TABLE!,
      IndexName: 'campaignId-compositeScore-index',
      KeyConditionExpression: 'campaignId = :cid',
      ExpressionAttributeValues: { ':cid': campaignId },
    }),
    dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } }),
  ])

  const totalSubmitted = ideas.length
  const totalEvaluated = scores.length
  const avgComposite = totalEvaluated > 0 ? scores.reduce((sum, s) => sum + s.compositeScore, 0) / totalEvaluated : 0

  const metrics: ParticipationMetrics = {
    campaignId,
    totalIdeasSubmitted: totalSubmitted,
    totalIdeasEvaluated: totalEvaluated,
    totalIdeasPending: totalSubmitted - totalEvaluated,
    totalPanelMembers: campaign?.panelMemberIds?.length ?? 0,
    averageCompositeScore: +avgComposite.toFixed(2),
  }

  return successResponse(metrics)
}
