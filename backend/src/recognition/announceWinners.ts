import type { APIGatewayProxyEventV2WithRequestContext, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext, WinnerRecord, WinnerAnnouncement, Campaign } from '../shared/types/index.js'
import { dbGet, dbQuery, dbUpdate } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { requireRole } from '../shared/middleware/rbac.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

type AuthEvent = APIGatewayProxyEventV2WithRequestContext<{ authorizer: { lambda: ApiGatewayAuthorizerContext } }>

async function announceWinnersHandler(event: AuthEvent): Promise<APIGatewayProxyResultV2> {
  const campaignId = event.pathParameters?.campaignId
  if (!campaignId) return errorResponse('VALIDATION_ERROR', 'campaignId is required')

  // Validate campaign is CLOSED
  const campaign = await dbGet<Campaign>({ TableName: process.env.CAMPAIGNS_TABLE!, Key: { campaignId } })
  if (!campaign) return errorResponse('CAMPAIGN_NOT_FOUND', 'Campaign not found')
  if (campaign.status !== 'CLOSED') return errorResponse('CAMPAIGN_NOT_CLOSED', 'Campaign must be in CLOSED status')

  // Get winners
  const { items: winners } = await dbQuery<WinnerRecord>({
    TableName: process.env.WINNERS_TABLE!,
    KeyConditionExpression: 'campaignId = :cid AND #r BETWEEN :one AND :three',
    ExpressionAttributeNames: { '#r': 'rank' },
    ExpressionAttributeValues: { ':cid': campaignId, ':one': 1, ':three': 3 },
  })
  if (winners.length === 0) return errorResponse('RECOGNITION_NOT_FOUND', 'No winners determined yet')

  // Check idempotency
  if (winners[0].announcedAt) return errorResponse('ALREADY_ANNOUNCED', 'Winners already announced')

  const now = new Date().toISOString()

  // Update winner records
  for (const w of winners) {
    await dbUpdate({
      TableName: process.env.WINNERS_TABLE!,
      Key: { campaignId, rank: w.rank },
      UpdateExpression: 'SET announcedAt = :now',
      ExpressionAttributeValues: { ':now': now },
    })
  }

  // Update announcement
  await dbUpdate({
    TableName: process.env.WINNERS_TABLE!,
    Key: { campaignId, rank: 0 },
    UpdateExpression: 'SET publishedAt = :now',
    ExpressionAttributeValues: { ':now': now },
  })

  // Update campaign status to ANNOUNCED
  await dbUpdate({
    TableName: process.env.CAMPAIGNS_TABLE!,
    Key: { campaignId },
    UpdateExpression: 'SET #s = :announced, updatedAt = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':announced': 'ANNOUNCED', ':now': now },
  })

  // Update winning ideas status to WINNER
  for (const w of winners) {
    await dbUpdate({
      TableName: process.env.IDEAS_TABLE!,
      Key: { ideaId: w.ideaId },
      UpdateExpression: 'SET #s = :winner, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':winner': 'WINNER', ':now': now },
    })
  }

  // Publish event for notifications
  await publishEvent('recognition.winners-announced', {
    campaignId,
    campaignName: campaign.name,
    winners: winners.map(w => ({ ideaId: w.ideaId, submitterId: w.submitterId, rank: w.rank, badgeType: w.badgeType, ideaTitle: w.ideaTitle })),
  })

  return successResponse({ message: 'Winners announced', campaignId })
}

export const handler = requireRole('ADMIN', announceWinnersHandler)
