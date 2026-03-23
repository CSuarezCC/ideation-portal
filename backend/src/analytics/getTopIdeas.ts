import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, Idea, User, TopIdea } from '../shared/types/index.js'
import { dbQuery, dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext, hasRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  if (!hasRole(auth.role, 'PANEL_MEMBER')) return errorResponse('ANALYTICS_ACCESS_DENIED', 'Analytics requires Panel Member or Admin role')

  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  const limitParam = parseInt(event.queryStringParameters?.limit ?? '10', 10)
  if (isNaN(limitParam) || limitParam < 1 || limitParam > 50) return errorResponse('INVALID_LIMIT', 'limit must be 1-50')

  const { items: scores } = await dbQuery<AggregatedScore>({
    TableName: process.env.AGGREGATED_SCORES_TABLE!,
    IndexName: 'campaignId-compositeScore-index',
    KeyConditionExpression: 'campaignId = :cid',
    ExpressionAttributeValues: { ':cid': campaignId },
    ScanIndexForward: false,
  })

  scores.sort((a, b) =>
    b.compositeScore - a.compositeScore ||
    b.feasibilityAvg - a.feasibilityAvg ||
    b.impactAvg - a.impactAvg ||
    b.innovationAvg - a.innovationAvg
  )

  const top = scores.slice(0, limitParam)

  const topIdeas: TopIdea[] = await Promise.all(top.map(async (s) => {
    const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId: s.ideaId } })
    const user = idea?.submitterId
      ? await dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId: idea.submitterId } })
      : undefined
    return {
      ideaId: s.ideaId, title: idea?.title ?? 'Unknown', submitterName: user?.name ?? 'Anonymous',
      compositeScore: s.compositeScore, feasibilityAvg: s.feasibilityAvg,
      impactAvg: s.impactAvg, innovationAvg: s.innovationAvg, totalEvaluations: s.totalEvaluations,
    }
  }))

  return successResponse(topIdeas)
}
