import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, AggregatedScore } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const aggregated = await dbGet<AggregatedScore>({
    TableName: process.env.AGGREGATED_SCORES_TABLE!,
    Key: { ideaId },
  })

  if (!aggregated) return successResponse(null)

  // Return averages + composite only (no individual evaluations)
  const { evaluations, ...scores } = aggregated
  return successResponse(scores)
}
