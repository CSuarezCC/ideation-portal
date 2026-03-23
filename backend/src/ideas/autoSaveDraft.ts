import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Idea } from '../shared/types/index.js'
import { dbGet } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.id
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId } })
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')

  const auth = getAuthContext(event)
  if (idea.submitterId !== auth.userId) return errorResponse('IDEA_NOT_OWNER', 'Not the idea owner')
  if (idea.status !== 'DRAFT') return errorResponse('IDEA_NOT_DRAFT', 'Only drafts can be auto-saved')

  const body = JSON.parse(event.body || '{}')
  const now = new Date().toISOString()

  const updates: string[] = ['updatedAt = :now']
  const values: Record<string, unknown> = { ':now': now }

  if (body.title !== undefined) { updates.push('title = :t'); values[':t'] = body.title }
  if (body.description !== undefined) { updates.push('description = :d'); values[':d'] = body.description }
  if (body.solution !== undefined) { updates.push('solution = :s'); values[':s'] = body.solution }
  if (body.benefits !== undefined) { updates.push('benefits = :b'); values[':b'] = body.benefits }
  if (body.categoryIds !== undefined) { updates.push('categoryIds = :c'); values[':c'] = body.categoryIds }
  if (body.attachments !== undefined) { updates.push('attachments = :a'); values[':a'] = body.attachments }

  await db.send(new UpdateCommand({
    TableName: process.env.IDEAS_TABLE!,
    Key: { ideaId },
    UpdateExpression: `SET ${updates.join(', ')}`,
    ExpressionAttributeValues: values,
  }))

  return successResponse({ savedAt: now })
}
