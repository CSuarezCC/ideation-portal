import { apiClient } from './apiClient'

export interface Campaign {
  campaignId: string
  name: string
  description: string
  submissionStartDate: string
  submissionEndDate: string
  evaluationStartDate: string
  evaluationEndDate: string
  status: string
  panelMemberIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  categoryId: string
  name: string
  description?: string
  isActive: string
  createdAt: string
  updatedAt: string
}

export const campaignService = {
  create: (data: Partial<Campaign>) => apiClient.post<Campaign>('/campaigns', data).then(r => r.data),
  list: (status?: string) => apiClient.get<{ items: Campaign[] }>('/campaigns', { params: status ? { status } : {} }).then(r => r.data.items),
  getActive: () => apiClient.get<Campaign | null>('/campaigns/active').then(r => r.data),
  get: (id: string) => apiClient.get<Campaign>(`/campaigns/${id}`).then(r => r.data),
  update: (id: string, data: Partial<Campaign>) => apiClient.put<Campaign>(`/campaigns/${id}`, data).then(r => r.data),
  transitionStatus: (id: string) => apiClient.put<Campaign>(`/campaigns/${id}/status`).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/campaigns/${id}`).then(r => r.data),
  assignPanelMembers: (id: string, userIds: string[]) => apiClient.post(`/campaigns/${id}/panel-members`, { userIds }).then(r => r.data),
  getPanelMembers: (id: string) => apiClient.get<{ items: any[] }>(`/campaigns/${id}/panel-members`).then(r => r.data.items),
  listCategories: (activeOnly = true) => apiClient.get<{ items: Category[] }>('/campaigns/categories', { params: { activeOnly: String(activeOnly) } }).then(r => r.data.items),
  createCategory: (data: { name: string; description?: string }) => apiClient.post<Category>('/campaigns/categories', data).then(r => r.data),
  updateCategory: (id: string, data: { name?: string; description?: string }) => apiClient.put<Category>(`/campaigns/categories/${id}`, data).then(r => r.data),
  deactivateCategory: (id: string) => apiClient.put(`/campaigns/categories/${id}/deactivate`).then(r => r.data),
}
