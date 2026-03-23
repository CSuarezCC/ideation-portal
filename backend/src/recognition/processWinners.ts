import type { EventBridgeEvent } from 'aws-lambda'
import type { AggregatedScore, WinnerRecord, WinnerAnnouncement, BadgeType } from '../shared/types/index.js'
import { dbPut, dbGet, dbQuery } from '../shared/db/dynamoClient.js'

interface CampaignClosedDetail {
  campaignId: string
  campaignName: string
}

const BADGE_MAP: Record<number, BadgeType> = { 1: 'GOLD', 2: 'SILVER', 3: 'BRONZE' }

export async function handler(event: EventBridgeEvent<string, CampaignClosedDetail>): Promise<void> {
  const { campaignId, campaignName } = event.detail

  // Idempotency check
  const { items: existing } = await dbQuery<WinnerRecord>({
    TableName: process.env.WINNERS_TABLE!,
    KeyConditionExpression: 'campaignId = :cid AND #r > :zero',
    ExpressionAttributeNames: { '#r': 'rank' },
    ExpressionAttributeValues: { ':cid': campaignId, ':zero': 0 },
    Limit: 1,
  })
  if (existing.length > 0) return

  // Get top scores
  const { items: scores } = await dbQuery<AggregatedScore>({
    TableName: process.env.AGGREGATED_SCORES_TABLE!,
    IndexName: 'campaignId-compositeScore-index',
    KeyConditionExpression: 'campaignId = :cid',
    ExpressionAttributeValues: { ':cid': campaignId },
    ScanIndexForward: false,
    Limit: 10,
  })
  if (scores.length === 0) return

  // Tie-break sort
  scores.sort((a, b) =>
    b.compositeScore - a.compositeScore
    || b.feasibilityAvg - a.feasibilityAvg
    || b.impactAvg - a.impactAvg
    || b.innovationAvg - a.innovationAvg
  )

  const top3 = scores.slice(0, 3)
  const now = new Date().toISOString()

  for (let i = 0; i < top3.length; i++) {
    const s = top3[i]
    const rank = i + 1
    const idea = await dbGet<{ submitterId: string; title: string }>({ TableName: process.env.IDEAS_TABLE!, Key: { ideaId: s.ideaId } })
    const user = idea ? await dbGet<{ name: string }>({ TableName: process.env.USERS_TABLE!, Key: { userId: idea.submitterId } }) : undefined
    const winner: WinnerRecord = {
      campaignId, rank, ideaId: s.ideaId,
      submitterId: idea?.submitterId ?? '', ideaTitle: idea?.title ?? '',
      submitterName: user?.name ?? '', compositeScore: s.compositeScore,
      badgeType: BADGE_MAP[rank], announcedAt: null, determinedAt: now,
    }
    await dbPut({ TableName: process.env.WINNERS_TABLE!, Item: winner })
  }

  const announcement: WinnerAnnouncement = {
    campaignId, rank: 0, campaignName,
    message: `Congratulations to the top ${top3.length} ideas from "${campaignName}"!`,
    publishedAt: null, createdAt: now,
  }
  await dbPut({ TableName: process.env.WINNERS_TABLE!, Item: announcement })
}
