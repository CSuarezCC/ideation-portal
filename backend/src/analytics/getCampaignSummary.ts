import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, Idea, Campaign, User, CampaignSummaryData, TopIdea, ScoreDistribution } from '../shared/types/index.js'
import { dbQuery, dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext, hasRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const BUCKET_RANGES: [string, number, number][] = [['1-2', 1, 2], ['3-4', 3, 4], ['5-6', 5, 6], ['7-8', 7, 8], ['9-10', 9, 10]]
const DIMENSIONS = ['composite', 'feasibility', 'impact', 'innovation'] as const

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const auth = getAuthContext(event)
  if (!hasRole(auth.role, 'PANEL_MEMBER')) return errorResponse('ANALYTICS_ACCESS_DENIED', 'Analytics requires Panel Member or Admin role')

  const campaignId = event.queryStringParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  const [campaign, { items: scores }, { items: ideas }] = await Promise.all([
    dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } }),
    dbQuery<AggregatedScore>({
      TableName: process.env.AGGREGATED_SCORES_TABLE!,
      IndexName: 'campaignId-compositeScore-index',
      KeyConditionExpression: 'campaignId = :cid',
      ExpressionAttributeValues: { ':cid': campaignId },
      ScanIndexForward: false,
    }),
    dbQuery<Idea>({
      TableName: process.env.IDEAS_TABLE!,
      IndexName: 'campaignId-status-index',
      KeyConditionExpression: 'campaignId = :cid',
      FilterExpression: '#s <> :draft',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':cid': campaignId, ':draft': 'DRAFT' },
    }),
  ])

  if (!campaign) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')

  const totalSubmitted = ideas.length
  const totalEvaluated = scores.length
  const avgComposite = totalEvaluated > 0 ? scores.reduce((sum, s) => sum + s.compositeScore, 0) / totalEvaluated : 0

  // Top 5 ideas
  const topScores = scores.slice(0, 5)
  const topIdeas: TopIdea[] = await Promise.all(topScores.map(async (s) => {
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

  // Score distributions
  const scoreDistributions: ScoreDistribution[] = DIMENSIONS.map(dim => {
    const key = dim === 'composite' ? 'compositeScore' : `${dim}Avg`
    return {
      campaignId, dimension: dim,
      buckets: BUCKET_RANGES.map(([rangeLabel, min, max]) => ({
        rangeLabel,
        count: scores.filter(s => {
          const val = s[key as keyof AggregatedScore] as number
          return val >= min && val <= max
        }).length,
      })),
    }
  })

  const summary: CampaignSummaryData = {
    campaignId, campaignName: campaign.name, status: campaign.status,
    participation: {
      campaignId, totalIdeasSubmitted: totalSubmitted, totalIdeasEvaluated: totalEvaluated,
      totalIdeasPending: totalSubmitted - totalEvaluated,
      totalPanelMembers: campaign.panelMemberIds?.length ?? 0,
      averageCompositeScore: +avgComposite.toFixed(2),
    },
    topIdeas, scoreDistributions,
  }

  return successResponse(summary)
}
