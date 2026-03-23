import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
})

// Inject access token on every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token as string}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${import.meta.env.VITE_API_URL as string}/auth/refresh`,
          { refreshToken }
        )
        localStorage.setItem('accessToken', data.accessToken)
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export { apiClient }
export default apiClient
