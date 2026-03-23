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
  if (idea.status !== 'DRAFT') return errorResponse('IDEA_NOT_DRAFT', 'Only drafts can be edited')

  const body = JSON.parse(event.body || '{}')
  const now = new Date().toISOString()

  await db.send(new UpdateCommand({
    TableName: process.env.IDEAS_TABLE!,
    Key: { ideaId },
    UpdateExpression: 'SET title = :t, description = :d, solution = :s, benefits = :b, categoryIds = :c, attachments = :a, updatedAt = :now',
    ExpressionAttributeValues: {
      ':t': body.title ?? idea.title,
      ':d': body.description ?? idea.description,
      ':s': body.solution ?? idea.solution,
      ':b': body.benefits ?? idea.benefits,
      ':c': body.categoryIds ?? idea.categoryIds,
      ':a': body.attachments ?? idea.attachments,
      ':now': now,
    },
  }))

  return successResponse({ ...idea, ...body, updatedAt: now })
}
