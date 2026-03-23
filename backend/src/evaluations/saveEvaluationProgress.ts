import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Evaluation, Campaign } from '../shared/types/index.js'
import { dbGet, dbPut } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

function validateScore(score: unknown): boolean {
  return score === undefined || score === null || (typeof score === 'number' && Number.isInteger(score) && score >= 1 && score <= 10)
}

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const auth = getAuthContext(event)
  const body = JSON.parse(event.body || '{}')

  // Check existing evaluation — reject if already submitted
  const existing = await dbGet<Evaluation>({
    TableName: process.env.EVALUATIONS_TABLE!,
    Key: { ideaId, panelMemberId: auth.userId },
  })
  if (existing?.status === 'SUBMITTED') return errorResponse('EVALUATION_ALREADY_SUBMITTED', 'Evaluation already submitted')

  // Verify panel member is assigned to idea's campaign
  const idea = await dbGet<{ campaignId: string }>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId } })
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId: idea.campaignId } })
  if (!campaign || !campaign.panelMemberIds.includes(auth.userId)) return errorResponse('NOT_PANEL_MEMBER', 'Not assigned to this campaign')

  // Lenient validation for draft
  for (const key of ['feasibilityScore', 'impactScore', 'innovationScore'] as const) {
    if (!validateScore(body[key])) return errorResponse('EVALUATION_VALIDATION_ERROR', `${key} must be integer 1-10`)
  }

  const now = new Date().toISOString()
  const evaluation: Evaluation = {
    ideaId,
    panelMemberId: auth.userId,
    campaignId: idea.campaignId,
    status: 'DRAFT',
    feasibilityScore: body.feasibilityScore ?? existing?.feasibilityScore,
    impactScore: body.impactScore ?? existing?.impactScore,
    innovationScore: body.innovationScore ?? existing?.innovationScore,
    feasibilityJustification: body.feasibilityJustification ?? existing?.feasibilityJustification,
    impactJustification: body.impactJustification ?? existing?.impactJustification,
    innovationJustification: body.innovationJustification ?? existing?.innovationJustification,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await dbPut({ TableName: process.env.EVALUATIONS_TABLE!, Item: evaluation })
  return successResponse(evaluation)
}
