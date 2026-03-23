import { apiClient } from './apiClient'

export interface EvaluationScores {
  feasibilityScore?: number
  impactScore?: number
  innovationScore?: number
  feasibilityJustification?: string
  impactJustification?: string
  innovationJustification?: string
}

export interface IdeaEvalStatus {
  ideaId: string
  title: string
  description: string
  categoryIds: string[]
  submittedAt?: string
  status: string
  evaluationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
}

export const evaluationService = {
  getIdeasForEvaluation: async (campaignId: string) => {
    const { data } = await apiClient.get<IdeaEvalStatus[]>('/evaluations/ideas', { params: { campaignId } })
    return data
  },
  getPending: async (campaignId: string) => {
    const { data } = await apiClient.get('/evaluations/pending', { params: { campaignId } })
    return data
  },
  getMyEvaluation: async (ideaId: string) => {
    const { data } = await apiClient.get(`/evaluations/${ideaId}/mine`)
    return data
  },
  saveProgress: async (ideaId: string, scores: EvaluationScores) => {
    const { data } = await apiClient.put(`/evaluations/${ideaId}/progress`, scores)
    return data
  },
  submit: async (ideaId: string, scores: EvaluationScores) => {
    const { data } = await apiClient.post(`/evaluations/${ideaId}/submit`, scores)
    return data
  },
  getSummary: async (ideaId: string) => {
    const { data } = await apiClient.get(`/evaluations/${ideaId}/summary`)
    return data
  },
  getAggregatedScore: async (ideaId: string) => {
    const { data } = await apiClient.get(`/evaluations/${ideaId}/score`)
    return data
  },
}
