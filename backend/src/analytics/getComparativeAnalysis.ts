import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, Idea, ComparativeIdeaRow } from '../shared/types/index.js'
import { dbQuery, dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext, hasRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const VALID_DIMENSIONS = ['composite', 'feasibility', 'impact', 'innovation'] as const

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  if (!hasRole(auth.role, 'PANEL_MEMBER')) return errorResponse('ANALYTICS_ACCESS_DENIED', 'Analytics requires Panel Member or Admin role')

  const campaignId = event.queryStringParameters?.campaignId
  const dimension = event.queryStringParameters?.dimension ?? 'composite'
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  if (!VALID_DIMENSIONS.includes(dimension as any)) return errorResponse('INVALID_DIMENSION', `Invalid dimension: ${dimension}`)

  const { items: scores } = await dbQuery<AggregatedScore>({
    TableName: process.env.AGGREGATED_SCORES_TABLE!,
    IndexName: 'campaignId-compositeScore-index',
    KeyConditionExpression: 'campaignId = :cid',
    ExpressionAttributeValues: { ':cid': campaignId },
  })

  const sortKey = dimension === 'composite' ? 'compositeScore' : `${dimension}Avg`
  scores.sort((a, b) => (b[sortKey as keyof AggregatedScore] as number) - (a[sortKey as keyof AggregatedScore] as number))

  const ideas: ComparativeIdeaRow[] = await Promise.all(scores.map(async (s) => {
    const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId: s.ideaId } })
    return {
      ideaId: s.ideaId, title: idea?.title ?? 'Unknown',
      feasibilityAvg: s.feasibilityAvg, impactAvg: s.impactAvg,
      innovationAvg: s.innovationAvg, compositeScore: s.compositeScore,
    }
  }))

  return successResponse({ campaignId, ideas })
}
