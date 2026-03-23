import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore, ScoreDistribution } from '../shared/types/index.js'
import { dbQuery } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext, hasRole } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const VALID_DIMENSIONS = ['composite', 'feasibility', 'impact', 'innovation'] as const
const BUCKET_RANGES: [string, number, number][] = [['1-2', 1, 2], ['3-4', 3, 4], ['5-6', 5, 6], ['7-8', 7, 8], ['9-10', 9, 10]]

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

  const key = dimension === 'composite' ? 'compositeScore' : `${dimension}Avg`

  const result: ScoreDistribution = {
    campaignId, dimension,
    buckets: BUCKET_RANGES.map(([rangeLabel, min, max]) => ({
      rangeLabel,
      count: scores.filter(s => {
        const val = s[key as keyof AggregatedScore] as number
        return val >= min && val <= max
      }).length,
    })),
  }

  return successResponse(result)
}
