import { apiClient } from './apiClient'

export interface WinnerRecord {
  campaignId: string
  rank: number
  ideaId: string
  submitterId: string
  ideaTitle: string
  submitterName: string
  compositeScore: number
  badgeType: 'GOLD' | 'SILVER' | 'BRONZE'
  announcedAt: string | null
  determinedAt: string
}

export interface WinnerAnnouncement {
  campaignId: string
  campaignName: string
  message: string
  publishedAt: string | null
  createdAt: string
}

export const recognitionService = {
  getWinners: (campaignId: string) =>
    apiClient.get<WinnerRecord[]>(`/recognition/${campaignId}/winners`).then(r => r.data),
  getAnnouncement: (campaignId: string) =>
    apiClient.get<WinnerAnnouncement>(`/recognition/${campaignId}/announcement`).then(r => r.data),
  announce: (campaignId: string) =>
    apiClient.post(`/recognition/${campaignId}/announce`, {}).then(r => r.data),
}
