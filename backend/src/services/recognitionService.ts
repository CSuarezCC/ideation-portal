import type { AggregatedScore, BadgeType, WinnerRecord, WinnerAnnouncement } from '../shared/types/index.js'
import { winnerRepository } from '../repositories/winnerRepository.js'
import { evaluationRepository } from '../repositories/evaluationRepository.js'
import { ideaRepository } from '../repositories/ideaRepository.js'
import { userRepository } from '../repositories/userRepository.js'
import { campaignRepository } from '../repositories/campaignRepository.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

const BADGE_MAP: Record<number, BadgeType> = { 1: 'GOLD', 2: 'SILVER', 3: 'BRONZE' }

export const recognitionService = {
  async processWinners(campaignId: string, campaignName: string) {
    // Idempotency
    const { items: existing } = await winnerRepository.getWinners(campaignId)
    if (existing.length > 0) return

    const { items: scores } = await evaluationRepository.listScoresByCampaign(campaignId)
    if (scores.length === 0) return

    scores.sort((a, b) => b.compositeScore - a.compositeScore || b.feasibilityAvg - a.feasibilityAvg || b.impactAvg - a.impactAvg || b.innovationAvg - a.innovationAvg)

    const now = new Date().toISOString()
    for (let i = 0; i < Math.min(3, scores.length); i++) {
      const s = scores[i]
      const idea = await ideaRepository.getById(s.ideaId)
      const user = idea ? await userRepository.getById(idea.submitterId) : undefined
      await winnerRepository.saveWinner({
        campaignId, rank: i + 1, ideaId: s.ideaId,
        submitterId: idea?.submitterId ?? '', ideaTitle: idea?.title ?? '',
        submitterName: user?.name ?? '', compositeScore: s.compositeScore,
        badgeType: BADGE_MAP[i + 1], announcedAt: null, determinedAt: now,
      })
    }

    await winnerRepository.saveAnnouncement({
      campaignId, rank: 0, campaignName,
      message: `Congratulations to the top ${Math.min(3, scores.length)} ideas from "${campaignName}"!`,
      publishedAt: null, createdAt: now,
    })
  },

  async announce(campaignId: string) {
    const campaign = await campaignRepository.getById(campaignId)
    if (!campaign) return { error: 'CAMPAIGN_NOT_FOUND' as const }
    if (campaign.status !== 'CLOSED') return { error: 'CAMPAIGN_NOT_CLOSED' as const }

    const { items: winners } = await winnerRepository.getWinners(campaignId)
    if (winners.length === 0) return { error: 'RECOGNITION_NOT_FOUND' as const }
    if (winners[0].announcedAt) return { error: 'ALREADY_ANNOUNCED' as const }

    const now = new Date().toISOString()
    for (const w of winners) await winnerRepository.setAnnouncedAt(campaignId, w.rank, now)
    await winnerRepository.setAnnouncedAt(campaignId, 0, now)
    await campaignRepository.updateStatus(campaignId, 'ANNOUNCED')
    for (const w of winners) await ideaRepository.updateStatus(w.ideaId, 'WINNER')

    await publishEvent('recognition.winners-announced', {
      campaignId, campaignName: campaign.name,
      winners: winners.map(w => ({ ideaId: w.ideaId, submitterId: w.submitterId, rank: w.rank, badgeType: w.badgeType, ideaTitle: w.ideaTitle })),
    })

    return { success: true }
  },
}
