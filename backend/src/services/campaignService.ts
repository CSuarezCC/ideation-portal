import { ulid } from 'ulid'
import type { Campaign, CampaignStatus } from '../shared/types/index.js'
import { campaignRepository } from '../repositories/campaignRepository.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

export const campaignService = {
  async create(fields: { name: string; description: string; submissionStartDate: string; submissionEndDate: string; evaluationStartDate: string; evaluationEndDate: string }, createdBy: string): Promise<Campaign> {
    const now = new Date().toISOString()
    const campaign: Campaign = {
      campaignId: ulid(), ...fields,
      status: 'DRAFT', panelMemberIds: [], createdBy, createdAt: now, updatedAt: now,
    }
    await campaignRepository.create(campaign)
    return campaign
  },

  async getById(campaignId: string) {
    return campaignRepository.getById(campaignId)
  },

  async getActive() {
    return campaignRepository.getActive()
  },

  async update(campaignId: string, fields: Partial<Campaign>) {
    await campaignRepository.update(campaignId, fields)
  },

  async softDelete(campaignId: string) {
    await campaignRepository.softDelete(campaignId)
  },

  async assignPanelMembers(campaignId: string, panelMemberIds: string[]) {
    await campaignRepository.setPanelMembers(campaignId, panelMemberIds)
  },

  async transitionStatus(campaignId: string, targetStatus: CampaignStatus, campaign: Campaign) {
    await campaignRepository.updateStatus(campaignId, targetStatus)
    const eventMap: Partial<Record<CampaignStatus, string>> = {
      ACTIVE: 'CampaignActivated',
      EVALUATION: 'CampaignEvaluationStarted',
      CLOSED: 'CampaignClosed',
    }
    const eventName = eventMap[targetStatus]
    if (eventName) {
      await publishEvent(eventName, {
        campaignId, campaignName: campaign.name, status: targetStatus,
        panelMemberIds: campaign.panelMemberIds, timestamp: new Date().toISOString(),
      })
    }
  },
}
