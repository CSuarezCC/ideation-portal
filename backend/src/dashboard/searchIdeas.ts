import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Idea, AggregatedScore, User, LeaderboardEntry } from '../shared/types/index.js'
import { dbQuery, dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  const query = event.queryStringParameters?.q
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')
  if (!query) return errorResponse('VALIDATION_ERROR', 'q (search query) is required')

  const auth = getAuthContext(event)
  const isEmployee = auth.role === 'EMPLOYEE'
  const queryLower = query.toLowerCase()

  const { items: ideas } = await dbQuery<Idea>({
    TableName: process.env.IDEAS_TABLE!,
    IndexName: 'campaignId-status-index',
    KeyConditionExpression: 'campaignId = :cid',
    FilterExpression: '#s <> :draft',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':cid': campaignId, ':draft': 'DRAFT' },
  })

  const filtered = ideas.filter(i =>
    i.title.toLowerCase().includes(queryLower) || i.description.toLowerCase().includes(queryLower)
  )

  const entries: LeaderboardEntry[] = await Promise.all(filtered.map(async (idea) => {
    const [score, user] = await Promise.all([
      dbGet<AggregatedScore>({ TableName: process.env.AGGREGATED_SCORES_TABLE!, Key: { ideaId: idea.ideaId } }),
      isEmployee ? Promise.resolve(null) : dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId: idea.submitterId } }),
    ])
    return {
      ideaId: idea.ideaId, title: idea.title, submitterName: isEmployee ? null : (user?.name ?? 'Anonymous'),
      submitterId: idea.submitterId, campaignId: idea.campaignId, categoryIds: idea.categoryIds,
      submittedAt: idea.submittedAt!, compositeScore: score?.compositeScore ?? null,
      feasibilityAvg: score?.feasibilityAvg ?? null, impactAvg: score?.impactAvg ?? null,
      innovationAvg: score?.innovationAvg ?? null, totalEvaluations: score?.totalEvaluations ?? null,
    }
  }))

  return successResponse(entries)
}
