import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, Idea } from '../shared/types/index.js'
import { dbGet, dbDelete } from '../shared/db/dynamoClient.js'
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { getAuthContext } from '../shared/middleware/rbac.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

const s3 = new S3Client({ region: process.env.REGION })

export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.id
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')

  const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId } })
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')

  const auth = getAuthContext(event)
  if (idea.submitterId !== auth.userId) return errorResponse('IDEA_NOT_OWNER', 'Not the idea owner')
  if (idea.status !== 'DRAFT') return errorResponse('IDEA_NOT_DRAFT', 'Only drafts can be deleted')

  // Delete S3 attachments
  if (idea.attachments.length > 0) {
    await s3.send(new DeleteObjectsCommand({
      Bucket: process.env.ATTACHMENTS_BUCKET!,
      Delete: { Objects: idea.attachments.map(a => ({ Key: a.fileKey })) },
    }))
  }

  await dbDelete({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId } })
  return successResponse({ message: 'Draft deleted' })
}
