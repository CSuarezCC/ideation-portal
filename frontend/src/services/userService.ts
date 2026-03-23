import apiClient from './apiClient'

export interface UserProfile {
  userId: string
  email: string
  name: string
  department?: string
  avatarUrl?: string
  role: 'EMPLOYEE' | 'PANEL_MEMBER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/users/me')
    return data
  },

  async updateProfile(updates: Partial<Pick<UserProfile, 'name' | 'department' | 'avatarUrl'>>) {
    const { data } = await apiClient.put<{ success: boolean; updatedAt: string }>('/users/me', updates)
    return data
  },

  async listUsers(params?: { role?: string; pageSize?: number; nextPageToken?: string }) {
    const { data } = await apiClient.get<{ users: UserProfile[]; nextPageToken?: string }>('/users', { params })
    return data
  },

  async assignRole(userId: string, role: UserProfile['role']) {
    const { data } = await apiClient.put<{ success: boolean }>(`/users/${userId}/role`, { role })
    return data
  },

  async deactivateUser(userId: string) {
    const { data } = await apiClient.delete<{ success: boolean }>(`/users/${userId}`)
    return data
  },
}
