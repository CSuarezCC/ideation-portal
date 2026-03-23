import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Evaluation, Campaign, AggregatedScore, AnonymizedEvaluation } from '../shared/types/index.js'
import { dbGet, dbPut, dbQuery } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

function round2(n: number): number { return Math.round(n * 100) / 100 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.ideaId
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const auth = getAuthContext(event)
  const body = JSON.parse(event.body || '{}')

  // Check existing
  const existing = await dbGet<Evaluation>({
    TableName: process.env.EVALUATIONS_TABLE!,
    Key: { ideaId, panelMemberId: auth.userId },
  })
  if (existing?.status === 'SUBMITTED') return errorResponse('EVALUATION_ALREADY_SUBMITTED', 'Evaluation already submitted')

  // Verify campaign + panel member
  const idea = await dbGet<{ campaignId: string }>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId } })
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')

  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId: idea.campaignId } })
  if (!campaign || !campaign.panelMemberIds.includes(auth.userId)) return errorResponse('NOT_PANEL_MEMBER', 'Not assigned to this campaign')

  // Strict validation
  const { feasibilityScore, impactScore, innovationScore, feasibilityJustification, impactJustification, innovationJustification } = body
  for (const [key, val] of Object.entries({ feasibilityScore, impactScore, innovationScore })) {
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 10)
      return errorResponse('EVALUATION_VALIDATION_ERROR', `${key} must be integer 1-10`)
  }
  for (const [key, val] of Object.entries({ feasibilityJustification, impactJustification, innovationJustification })) {
    if (typeof val !== 'string' || val.trim().length === 0)
      return errorResponse('EVALUATION_VALIDATION_ERROR', `${key} is required`)
  }

  const now = new Date().toISOString()
  const evaluation: Evaluation = {
    ideaId, panelMemberId: auth.userId, campaignId: idea.campaignId, status: 'SUBMITTED',
    feasibilityScore, impactScore, innovationScore,
    feasibilityJustification: feasibilityJustification.trim(),
    impactJustification: impactJustification.trim(),
    innovationJustification: innovationJustification.trim(),
    createdAt: existing?.createdAt ?? now, updatedAt: now, submittedAt: now,
  }

  await dbPut({ TableName: process.env.EVALUATIONS_TABLE!, Item: evaluation })
  await publishEvent('EvaluationSubmitted', { ideaId, campaignId: idea.campaignId, panelMemberId: auth.userId, timestamp: now })

  // Check if all panel members have scored → trigger aggregation
  const { items: allEvals } = await dbQuery<Evaluation>({
    TableName: process.env.EVALUATIONS_TABLE!,
    KeyConditionExpression: 'ideaId = :id',
    ExpressionAttributeValues: { ':id': ideaId },
  })
  const submittedCount = allEvals.filter(e => e.status === 'SUBMITTED').length
  if (submittedCount >= campaign.panelMemberIds.length) {
    await triggerAggregation(ideaId, idea.campaignId, allEvals.filter(e => e.status === 'SUBMITTED'), now)
  }

  return successResponse(evaluation)
}

async function triggerAggregation(ideaId: string, campaignId: string, evals: Evaluation[], now: string) {
  const n = evals.length
  const feasibilityAvg = round2(evals.reduce((s, e) => s + e.feasibilityScore!, 0) / n)
  const impactAvg = round2(evals.reduce((s, e) => s + e.impactScore!, 0) / n)
  const innovationAvg = round2(evals.reduce((s, e) => s + e.innovationScore!, 0) / n)
  const compositeScore = round2((feasibilityAvg + impactAvg + innovationAvg) / 3)

  const anonymized: AnonymizedEvaluation[] = shuffle(evals).map((e, i) => ({
    evaluatorIndex: i + 1,
    feasibilityScore: e.feasibilityScore!, impactScore: e.impactScore!, innovationScore: e.innovationScore!,
    feasibilityJustification: e.feasibilityJustification!, impactJustification: e.impactJustification!, innovationJustification: e.innovationJustification!,
  }))

  const aggregated: AggregatedScore = {
    ideaId, campaignId, feasibilityAvg, impactAvg, innovationAvg, compositeScore,
    totalEvaluations: n, evaluations: anonymized, calculatedAt: now,
  }

  try {
    await db.send(new PutCommand({
      TableName: process.env.AGGREGATED_SCORES_TABLE!,
      Item: aggregated,
      ConditionExpression: 'attribute_not_exists(ideaId)',
    }))

    // Transition idea to EVALUATED
    await db.send(new UpdateCommand({
      TableName: process.env.IDEAS_TABLE!,
      Key: { ideaId },
      UpdateExpression: 'SET #s = :s, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'EVALUATED', ':now': now },
    }))

    await publishEvent('EvaluationAggregationComplete', { ideaId, campaignId, compositeScore, timestamp: now })
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') return // already aggregated
    throw err
  }
}
