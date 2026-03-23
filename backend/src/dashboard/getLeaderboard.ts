import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, Idea, User, LeaderboardEntry } from '../shared/types/index.js'
import { dbQuery, dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const VALID_DIMENSIONS = ['composite', 'feasibility', 'impact', 'innovation', 'most_recent'] as const
type Dimension = (typeof VALID_DIMENSIONS)[number]

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  const dimension = (event.queryStringParameters?.dimension ?? 'composite') as Dimension
  if (!VALID_DIMENSIONS.includes(dimension)) return errorResponse('INVALID_DIMENSION', `Invalid dimension: ${dimension}`)

  const auth = getAuthContext(event)
  const isEmployee = auth.role === 'EMPLOYEE'

  let entries: LeaderboardEntry[]

  if (dimension === 'most_recent') {
    const { items: ideas } = await dbQuery<Idea>({
      TableName: process.env.IDEAS_TABLE!,
      IndexName: 'campaignId-status-index',
      KeyConditionExpression: 'campaignId = :cid',
      FilterExpression: '#s <> :draft',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':cid': campaignId, ':draft': 'DRAFT' },
    })
    ideas.sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!))

    const scoreMap = new Map<string, AggregatedScore>()
    await Promise.all(ideas.map(async (idea) => {
      const score = await dbGet<AggregatedScore>({ TableName: process.env.AGGREGATED_SCORES_TABLE!, Key: { ideaId: idea.ideaId } })
      if (score) scoreMap.set(idea.ideaId, score)
    }))

    entries = await buildEntries(ideas, scoreMap, isEmployee)
  } else {
    const { items: scores } = await dbQuery<AggregatedScore>({
      TableName: process.env.AGGREGATED_SCORES_TABLE!,
      IndexName: 'campaignId-compositeScore-index',
      KeyConditionExpression: 'campaignId = :cid',
      ExpressionAttributeValues: { ':cid': campaignId },
      ScanIndexForward: false,
    })

    if (dimension !== 'composite') {
      const key = `${dimension}Avg` as keyof AggregatedScore
      scores.sort((a, b) => (b[key] as number) - (a[key] as number))
    }

    const ideaMap = new Map<string, Idea>()
    await Promise.all(scores.map(async (s) => {
      const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId: s.ideaId } })
      if (idea) ideaMap.set(s.ideaId, idea)
    }))

    entries = await buildEntriesFromScores(scores, ideaMap, isEmployee)
  }

  return successResponse(entries)
}

async function resolveUserName(userId: string): Promise<string> {
  const user = await dbGet<User>({ TableName: process.env.USERS_TABLE!, Key: { userId } })
  return user?.name ?? 'Anonymous'
}

async function buildEntries(ideas: Idea[], scoreMap: Map<string, AggregatedScore>, isEmployee: boolean): Promise<LeaderboardEntry[]> {
  return Promise.all(ideas.map(async (idea) => {
    const score = scoreMap.get(idea.ideaId)
    const name = isEmployee ? null : await resolveUserName(idea.submitterId)
    return {
      ideaId: idea.ideaId, title: idea.title, submitterName: name, submitterId: idea.submitterId,
      campaignId: idea.campaignId, categoryIds: idea.categoryIds, submittedAt: idea.submittedAt!,
      compositeScore: score?.compositeScore ?? null, feasibilityAvg: score?.feasibilityAvg ?? null,
      impactAvg: score?.impactAvg ?? null, innovationAvg: score?.innovationAvg ?? null,
      totalEvaluations: score?.totalEvaluations ?? null,
    }
  }))
}

async function buildEntriesFromScores(scores: AggregatedScore[], ideaMap: Map<string, Idea>, isEmployee: boolean): Promise<LeaderboardEntry[]> {
  return Promise.all(scores.map(async (score) => {
    const idea = ideaMap.get(score.ideaId)
    const name = isEmployee ? null : await resolveUserName(idea?.submitterId ?? '')
    return {
      ideaId: score.ideaId, title: idea?.title ?? 'Unknown', submitterName: name,
      submitterId: idea?.submitterId ?? '', campaignId: score.campaignId,
      categoryIds: idea?.categoryIds ?? [], submittedAt: idea?.submittedAt ?? '',
      compositeScore: score.compositeScore, feasibilityAvg: score.feasibilityAvg,
      impactAvg: score.impactAvg, innovationAvg: score.innovationAvg,
      totalEvaluations: score.totalEvaluations,
    }
  }))
}
