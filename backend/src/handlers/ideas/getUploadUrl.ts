import { ulid } from 'ulid'
import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { getAuthContext } from '../../shared/middleware/rbac.js'
type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>
const s3 = new S3Client({ region: process.env.REGION })
export async function handler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const ideaId = event.pathParameters?.id
  if (!ideaId) return errorResponse('VALIDATION_ERROR', 'Idea ID is required')
  const idea = await ideaRepository.getById(ideaId)
  if (!idea) return errorResponse('IDEA_NOT_FOUND', 'Idea not found')
  const auth = getAuthContext(event)
  if (idea.submitterId !== auth.userId) return errorResponse('IDEA_NOT_OWNER', 'Not the idea owner')
  if (idea.status !== 'DRAFT') return errorResponse('IDEA_NOT_DRAFT', 'Only drafts can have attachments')
  if (idea.attachments.length >= 5) return errorResponse('ATTACHMENT_LIMIT_EXCEEDED', 'Maximum 5 attachments allowed')
  const body = JSON.parse(event.body || '{}')
  const { fileName, contentType, fileSize } = body
  if (!fileName || !contentType) return errorResponse('VALIDATION_ERROR', 'fileName and contentType are required')
  if (fileSize && fileSize > 10_485_760) return errorResponse('FILE_TOO_LARGE', 'File exceeds 10MB limit')
  const fileKey = `ideas/${ideaId}/${ulid()}-${fileName}`
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.ATTACHMENTS_BUCKET!, Key: fileKey, ContentType: contentType }), { expiresIn: 900 })
  return successResponse({ uploadUrl, fileKey })
}
