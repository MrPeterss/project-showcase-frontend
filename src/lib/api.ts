import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { auth } from './firebase'

// Base API configuration
export const API_BASE_URL = '/api'

// Create Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    } catch (error) {
      console.error('Error getting auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          // Force refresh the Firebase token
          const newFirebaseToken = await currentUser.getIdToken(true)
          // Save refreshed Firebase token to localStorage
          localStorage.setItem('firebase_token', newFirebaseToken)

          // Verify the token with the backend to get a new access token
          const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-token`, { firebaseToken: newFirebaseToken })
          const newAccessToken = verifyResponse.data.data.accessToken
          
          // Save the new access token
          localStorage.setItem('access_token', newAccessToken)

          // Update the request headers with the new access token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }
          
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Token refresh failed, log user out
        console.error('Token refresh failed:', refreshError)
        localStorage.removeItem('firebase_token')
        localStorage.removeItem('access_token')

        // Sign out from Firebase
        try {
          await auth.signOut()
        } catch (signOutError) {
          console.error('Error signing out:', signOutError)
        }

        // Redirect to login or refresh page
        window.location.href = '/login' // or handle this in your app routing
      }
    }

    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Generic API methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config),
}

export default api
