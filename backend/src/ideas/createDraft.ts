import { ulid } from 'ulid'
import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../shared/types/index.js'
import { dbPut } from '../shared/db/dynamoClient.js'
import { successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const auth = getAuthContext(event)
  const now = new Date().toISOString()

  const idea = {
    ideaId: ulid(),
    title: body.title || '',
    description: body.description || '',
    solution: body.solution || '',
    benefits: body.benefits || '',
    categoryIds: body.categoryIds || [],
    campaignId: '',
    submitterId: auth.userId,
    status: 'DRAFT' as const,
    attachments: [],
    createdAt: now,
    updatedAt: now,
  }

  await dbPut({ TableName: process.env.IDEAS_TABLE!, Item: idea })
  return successResponse(idea, 201)
}
