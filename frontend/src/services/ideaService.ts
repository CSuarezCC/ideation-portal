import { apiClient } from './apiClient'
import axios from 'axios'

export interface Attachment {
  fileKey: string
  fileName: string
  fileSize: number
  contentType: string
  uploadedAt: string
}

export interface Idea {
  ideaId: string
  title: string
  description: string
  solution: string
  benefits: string
  categoryIds: string[]
  campaignId: string
  submitterId: string
  status: string
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export const ideaService = {
  createDraft: (data?: Partial<Idea>) => apiClient.post<Idea>('/ideas/draft', data || {}).then(r => r.data),
  updateDraft: (id: string, data: Partial<Idea>) => apiClient.put<Idea>(`/ideas/${id}/draft`, data).then(r => r.data),
  autoSave: (id: string, data: Partial<Idea>) => apiClient.put<{ savedAt: string }>(`/ideas/${id}/autosave`, data).then(r => r.data),
  submit: (id: string) => apiClient.post<Idea>(`/ideas/${id}/submit`).then(r => r.data),
  deleteDraft: (id: string) => apiClient.delete(`/ideas/${id}`).then(r => r.data),
  list: (campaignId: string, status?: string) => apiClient.get<{ items: Idea[] }>('/ideas', { params: { campaignId, ...(status ? { status } : {}) } }).then(r => r.data.items),
  getMyIdeas: (status?: string) => apiClient.get<{ items: Idea[] }>('/ideas/mine', { params: status ? { status } : {} }).then(r => r.data.items),
  get: (id: string) => apiClient.get<Idea>(`/ideas/${id}`).then(r => r.data),
  getUploadUrl: (id: string, fileName: string, contentType: string, fileSize: number) =>
    apiClient.post<{ uploadUrl: string; fileKey: string }>(`/ideas/${id}/upload-url`, { fileName, contentType, fileSize }).then(r => r.data),
  uploadFile: async (uploadUrl: string, file: File) => {
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })
  },
}
