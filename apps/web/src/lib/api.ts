import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined' && !error.config._retry) {
      error.config._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'
          const { data } = await axios.post(baseURL + '/auth/refresh', { refreshToken })
          localStorage.setItem('token', data.data.token)
          document.cookie = 'token=' + data.data.token + '; path=/; samesite=strict'
          error.config.headers.Authorization = 'Bearer ' + data.data.token
          return api(error.config)
        }
      } catch {
        // Refresh failed, fall through to logout
      }
    }
    // If still 401 after refresh attempt, logout
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
