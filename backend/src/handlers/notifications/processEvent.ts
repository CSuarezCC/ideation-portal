import type { EventBridgeEvent } from 'aws-lambda'
import type { Idea } from '../../shared/types/index.js'
import { ideaRepository } from '../../repositories/ideaRepository.js'
import { userRepository } from '../../repositories/userRepository.js'
import { notificationService } from '../../services/notificationService.js'
interface EventDetail { ideaId?: string; ideaTitle?: string; submitterId?: string; campaignId?: string; campaignName?: string; panelMemberIds?: string[]; winners?: Array<{ submitterId: string; rank: number; badgeType: string; ideaTitle: string }>; [key: string]: unknown }
export async function handler(event: EventBridgeEvent<string, EventDetail>): Promise<void> {
  const detailType = event['detail-type']
  const d = event.detail
  switch (detailType) {
    case 'idea.submitted':
      await notificationService.createForUser(d.submitterId!, 'IDEA_SUBMITTED', 'Idea Submitted', `Your idea "${d.ideaTitle}" has been submitted.`, d.ideaId!, 'idea')
      break
    case 'campaign.activated':
      await notificationService.broadcastToAllActive('CAMPAIGN_ACTIVATED', `New Campaign: ${d.campaignName}`, `Campaign "${d.campaignName}" is now open for submissions.`, d.campaignId!, 'campaign')
      break
    case 'campaign.evaluation-started': {
      const submitterIds = (await ideaRepository.listByCampaign(d.campaignId!)).items.map(i => i.submitterId)
      const adminIds = (await userRepository.listByRole('ADMIN')).map(u => u.userId)
      const recipients = [...new Set([...submitterIds, ...(d.panelMemberIds ?? []), ...adminIds])]
      await notificationService.broadcastToUsers(recipients, 'CAMPAIGN_EVALUATION_STARTED', `Evaluation Started: ${d.campaignName}`, `Evaluation period has begun for "${d.campaignName}".`, d.campaignId!, 'campaign')
      break
    }
    case 'campaign.closed': {
      const submitterIds2 = (await ideaRepository.listByCampaign(d.campaignId!)).items.map(i => i.submitterId)
      const adminIds2 = (await userRepository.listByRole('ADMIN')).map(u => u.userId)
      const recipients2 = [...new Set([...submitterIds2, ...(d.panelMemberIds ?? []), ...adminIds2])]
      await notificationService.broadcastToUsers(recipients2, 'CAMPAIGN_CLOSED', `Campaign Closed: ${d.campaignName}`, `Campaign "${d.campaignName}" has been closed.`, d.campaignId!, 'campaign')
      break
    }
    case 'evaluation.aggregation-complete': {
      const idea = await ideaRepository.getById(d.ideaId!)
      if (idea) await notificationService.createForUser(idea.submitterId, 'EVALUATION_COMPLETE', 'Your Idea Has Been Evaluated', `All panel members have scored "${idea.title}".`, d.ideaId!, 'evaluation')
      break
    }
    case 'recognition.winners-announced': {
      if (d.winners) for (const w of d.winners) await notificationService.createForUser(w.submitterId, 'WINNERS_ANNOUNCED', `\u{1F3C6} Your idea won ${w.badgeType}!`, `"${w.ideaTitle}" placed #${w.rank} in "${d.campaignName}".`, d.campaignId!, 'recognition')
      const admins = await userRepository.listByRole('ADMIN')
      for (const admin of admins) await notificationService.createForUser(admin.userId, 'WINNERS_ANNOUNCED', 'Winners Announced', `Winners for "${d.campaignName}" have been announced.`, d.campaignId!, 'recognition')
      break
    }
  }
}
