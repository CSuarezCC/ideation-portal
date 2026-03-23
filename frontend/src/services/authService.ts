import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL as string

// Auth calls use plain axios (no token needed)
const authAxios = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } })

export const authService = {
  async login(email: string, password: string) {
    const { data } = await authAxios.post<{ accessToken: string; refreshToken: string; idToken: string }>(
      '/auth/login', { email, password }
    )
    return data
  },

  async register(email: string, password: string, name: string, department?: string) {
    const { data } = await authAxios.post<{ userId: string; message: string }>(
      '/auth/register', { email, password, name, department }
    )
    return data
  },

  async confirmAccount(email: string, confirmationCode: string) {
    const { data } = await authAxios.post<{ success: boolean }>('/auth/confirm', { email, confirmationCode })
    return data
  },

  async forgotPassword(email: string) {
    const { data } = await authAxios.post<{ message: string }>('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const { data } = await authAxios.post<{ success: boolean }>('/auth/reset-password', { email, code, newPassword })
    return data
  },
}
