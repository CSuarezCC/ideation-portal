import { apiClient } from './apiClient'

export interface TopIdea {
  ideaId: string
  title: string
  submitterName: string
  compositeScore: number
  feasibilityAvg: number
  impactAvg: number
  innovationAvg: number
  totalEvaluations: number
}

export interface ParticipationMetrics {
  campaignId: string
  totalIdeasSubmitted: number
  totalIdeasEvaluated: number
  totalIdeasPending: number
  totalPanelMembers: number
  averageCompositeScore: number
}

export interface ScoreBucket {
  rangeLabel: string
  count: number
}

export interface ScoreDistribution {
  campaignId: string
  dimension: string
  buckets: ScoreBucket[]
}

export interface ComparativeIdeaRow {
  ideaId: string
  title: string
  feasibilityAvg: number
  impactAvg: number
  innovationAvg: number
  compositeScore: number
}

export interface CampaignSummaryData {
  campaignId: string
  campaignName: string
  status: string
  participation: ParticipationMetrics
  topIdeas: TopIdea[]
  scoreDistributions: ScoreDistribution[]
}

export const analyticsService = {
  getTopIdeas: (campaignId: string, limit = 10) =>
    apiClient.get<TopIdea[]>('/analytics/top-ideas', { params: { campaignId, limit } }).then(r => r.data),
  getComparative: (campaignId: string, dimension = 'composite') =>
    apiClient.get<{ campaignId: string; ideas: ComparativeIdeaRow[] }>('/analytics/comparative', { params: { campaignId, dimension } }).then(r => r.data),
  getParticipation: (campaignId: string) =>
    apiClient.get<ParticipationMetrics>('/analytics/participation', { params: { campaignId } }).then(r => r.data),
  getScoreDistribution: (campaignId: string, dimension = 'composite') =>
    apiClient.get<ScoreDistribution>('/analytics/score-distribution', { params: { campaignId, dimension } }).then(r => r.data),
  getCampaignSummary: (campaignId: string) =>
    apiClient.get<CampaignSummaryData>('/analytics/campaign-summary', { params: { campaignId } }).then(r => r.data),
}
