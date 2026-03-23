import type { EventBridgeEvent } from 'aws-lambda'
import { ulid } from 'ulid'
import type { Notification, NotificationType, Idea, Campaign, User } from '../shared/types/index.js'
import { dbPut, dbQuery, dbGet, dbScan, dbBatchWrite } from '../shared/db/dynamoClient.js'

interface EventDetail {
  ideaId?: string
  ideaTitle?: string
  submitterId?: string
  campaignId?: string
  campaignName?: string
  panelMemberIds?: string[]
  [key: string]: unknown
}

const EVENT_TYPE_MAP: Record<string, NotificationType> = {
  'idea.submitted': 'IDEA_SUBMITTED',
  'campaign.activated': 'CAMPAIGN_ACTIVATED',
  'campaign.evaluation-started': 'CAMPAIGN_EVALUATION_STARTED',
  'campaign.closed': 'CAMPAIGN_CLOSED',
  'evaluation.aggregation-complete': 'EVALUATION_COMPLETE',
  'recognition.winners-announced': 'WINNERS_ANNOUNCED',
}

export async function handler(event: EventBridgeEvent<string, EventDetail>): Promise<void> {
  const detailType = event['detail-type']
  const detail = event.detail

  switch (detailType) {
    case 'idea.submitted':
      await createNotification(detail.submitterId!, 'IDEA_SUBMITTED',
        'Idea Submitted', `Your idea "${detail.ideaTitle}" has been submitted.`,
        detail.ideaId!, 'idea')
      break

    case 'campaign.activated':
      await broadcastToAllUsers('CAMPAIGN_ACTIVATED',
        `New Campaign: ${detail.campaignName}`, `Campaign "${detail.campaignName}" is now open for submissions.`,
        detail.campaignId!, 'campaign')
      break

    case 'campaign.evaluation-started':
      await broadcastToCampaignStakeholders(detail.campaignId!, detail.panelMemberIds ?? [],
        'CAMPAIGN_EVALUATION_STARTED',
        `Evaluation Started: ${detail.campaignName}`, `Evaluation period has begun for "${detail.campaignName}".`,
        'campaign')
      break

    case 'campaign.closed':
      await broadcastToCampaignStakeholders(detail.campaignId!, detail.panelMemberIds ?? [],
        'CAMPAIGN_CLOSED',
        `Campaign Closed: ${detail.campaignName}`, `Campaign "${detail.campaignName}" has been closed.`,
        'campaign')
      break

    case 'evaluation.aggregation-complete': {
      const idea = await dbGet<Idea>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId: detail.ideaId } })
      if (idea) {
        await createNotification(idea.submitterId, 'EVALUATION_COMPLETE',
          'Your Idea Has Been Evaluated', `All panel members have scored "${idea.title}".`,
          detail.ideaId!, 'evaluation')
      }
      break
    }

    case 'recognition.winners-announced': {
      const winnersList = detail.winners as Array<{ submitterId: string; rank: number; badgeType: string; ideaTitle: string }>
      if (winnersList) {
        for (const w of winnersList) {
          await createNotification(w.submitterId, 'WINNERS_ANNOUNCED',
            `🏆 Your idea won ${w.badgeType}!`, `"${w.ideaTitle}" placed #${w.rank} in "${detail.campaignName}".`,
            detail.campaignId!, 'recognition')
        }
      }
      // Notify admins
      const { items: admins } = await dbScan<User>({ TableName: process.env.USERS_TABLE!, FilterExpression: '#r = :admin', ExpressionAttributeNames: { '#r': 'role' }, ExpressionAttributeValues: { ':admin': 'ADMIN' } })
      for (const admin of admins) {
        await createNotification(admin.userId, 'WINNERS_ANNOUNCED',
          'Winners Announced', `Winners for "${detail.campaignName}" have been announced. Follow up with HR for recognition.`,
          detail.campaignId!, 'recognition')
      }
      break
    }

    default:
      console.warn('Unknown event type:', detailType)
  }
}

async function createNotification(userId: string, type: NotificationType, title: string, message: string, resourceId: string, resourceType: Notification['resourceType']): Promise<void> {
  const notification: Notification = {
    userId, notificationId: ulid(), type, title, message, resourceId, resourceType,
    isRead: false, createdAt: new Date().toISOString(),
  }
  await dbPut({ TableName: process.env.NOTIFICATIONS_TABLE!, Item: notification })
}

async function broadcastToAllUsers(type: NotificationType, title: string, message: string, resourceId: string, resourceType: Notification['resourceType']): Promise<void> {
  const { items: users } = await dbScan<User>({ TableName: process.env.USERS_TABLE!, FilterExpression: '#s = :active', ExpressionAttributeNames: { '#s': 'status' }, ExpressionAttributeValues: { ':active': 'ACTIVE' } })
  const items = users.map(u => ({
    userId: u.userId, notificationId: ulid(), type, title, message, resourceId, resourceType,
    isRead: false, createdAt: new Date().toISOString(),
  }))
  await dbBatchWrite(process.env.NOTIFICATIONS_TABLE!, items)
}

async function broadcastToCampaignStakeholders(campaignId: string, panelMemberIds: string[], type: NotificationType, title: string, message: string, resourceType: Notification['resourceType']): Promise<void> {
  // Get idea submitters for this campaign
  const { items: ideas } = await dbQuery<Idea>({
    TableName: process.env.IDEAS_TABLE!,
    IndexName: 'campaignId-status-index',
    KeyConditionExpression: 'campaignId = :cid',
    FilterExpression: '#s <> :draft',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':cid': campaignId, ':draft': 'DRAFT' },
  })
  const submitterIds = ideas.map(i => i.submitterId)

  // Get admin users
  const { items: admins } = await dbScan<User>({ TableName: process.env.USERS_TABLE!, FilterExpression: '#r = :admin', ExpressionAttributeNames: { '#r': 'role' }, ExpressionAttributeValues: { ':admin': 'ADMIN' } })
  const adminIds = admins.map(u => u.userId)

  // Deduplicate
  const recipientIds = [...new Set([...submitterIds, ...panelMemberIds, ...adminIds])]

  const items = recipientIds.map(userId => ({
    userId, notificationId: ulid(), type, title, message, resourceId: campaignId, resourceType,
    isRead: false, createdAt: new Date().toISOString(),
  }))
  await dbBatchWrite(process.env.NOTIFICATIONS_TABLE!, items)
}
