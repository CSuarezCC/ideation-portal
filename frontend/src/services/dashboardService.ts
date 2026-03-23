import { apiClient } from './apiClient'

export interface LeaderboardEntry {
  ideaId: string
  title: string
  submitterName: string | null
  submitterId: string
  campaignId: string
  categoryIds: string[]
  compositeScore: number | null
  feasibilityAvg: number | null
  impactAvg: number | null
  innovationAvg: number | null
  totalEvaluations: number | null
  submittedAt: string
}

export interface IdeaDetail {
  ideaId: string
  title: string
  description: string
  solution: string
  benefits: string
  categoryIds: string[]
  campaignId: string
  submitterName: string | null
  status: string
  compositeScore: number | null
  feasibilityAvg: number | null
  impactAvg: number | null
  innovationAvg: number | null
  totalEvaluations: number | null
  evaluations: { evaluatorIndex: number; feasibilityScore: number; impactScore: number; innovationScore: number; feasibilityJustification: string; impactJustification: string; innovationJustification: string }[] | null
  submittedAt?: string
}

export const dashboardService = {
  getLeaderboard: (campaignId: string, dimension = 'composite') =>
    apiClient.get<LeaderboardEntry[]>('/dashboard/leaderboard', { params: { campaignId, dimension } }).then(r => r.data),
  getIdeaDetail: (ideaId: string) =>
    apiClient.get<IdeaDetail>(`/dashboard/ideas/${ideaId}`).then(r => r.data),
  getSummary: (campaignId: string) =>
    apiClient.get<{ totalEvaluatedIdeas: number; highestCompositeScore: number; averageCompositeScore: number }>('/dashboard/summary', { params: { campaignId } }).then(r => r.data),
  search: (campaignId: string, q: string) =>
    apiClient.get<LeaderboardEntry[]>('/dashboard/search', { params: { campaignId, q } }).then(r => r.data),
}
