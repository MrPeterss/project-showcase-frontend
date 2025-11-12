import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { tokenManager } from './tokenManager'
import authServices from '@/services/auth'
import { auth } from './firebase'
import { dispatch } from '@/store'
import { triggerUserRefresh } from '@/store/slices/userSlice'

// Base API configuration
export const API_BASE_URL = '/api'

// Shared refresh token promise to prevent multiple simultaneous refresh attempts
let refreshTokenPromise: Promise<string> | null = null

// Create Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const isRefreshTokenEndpoint = config.url?.includes('/auth/refresh-token')
      
      // Skip token logic for refresh token endpoint itself
      if (isRefreshTokenEndpoint) {
        return config
      }
      
      if (tokenManager.hasToken()) {
        // If a refresh is already in progress, wait for it
        if (!refreshTokenPromise) {
          refreshTokenPromise = (async () => {
            try {
              const refreshResponse = await authServices.refreshToken()
              const newAccessToken = refreshResponse.data.accessToken
              
              if (!newAccessToken) {
                throw new Error('No access token in refresh response')
              }
              
              tokenManager.setToken(newAccessToken)
              dispatch(triggerUserRefresh())
              
              return newAccessToken
            } catch (refreshError) {
              console.error('Proactive token refresh failed:', refreshError)
              tokenManager.clearToken()
              throw refreshError
            } finally {
              setTimeout(() => {
                refreshTokenPromise = null
              }, 1000)
            }
          })()
        }
      }
      
      // If a refresh is in progress (from proactive refresh or error handler), wait for it
      if (refreshTokenPromise) {
        try {
          await refreshTokenPromise
        } catch (error) {
          // Refresh failed, continue with current token (will fail and redirect if needed)
        }
      }
      
      const accessToken = tokenManager.getToken()
      
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
      
      return config
    } catch (error) {
      console.error('Error getting auth token:', error)
      return config
    }
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
    const originalRequest = error.config as AxiosRequestConfig & { 
      _retry?: boolean
      _skipRefresh?: boolean
    }

    const isRefreshTokenEndpoint = originalRequest.url?.includes('/auth/refresh-token')
    
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest._skipRefresh &&
      !isRefreshTokenEndpoint
    ) {
      originalRequest._retry = true

      // If a refresh is already in progress, wait for it instead of starting a new one
      if (!refreshTokenPromise) {
        refreshTokenPromise = (async () => {
          try {
            const refreshResponse = await authServices.refreshToken()
            const newAccessToken = refreshResponse.data.accessToken
            
            if (!newAccessToken) {
              throw new Error('No access token in refresh response')
            }
            
            // Store the new access token in memory
            tokenManager.setToken(newAccessToken)
            
            // Dispatch Redux action to trigger user refresh in useAuth hook
            dispatch(triggerUserRefresh())
            
            return newAccessToken
          } catch (refreshError) {
            // Token refresh failed, clear token and redirect to login
            console.error('Token refresh failed:', refreshError)
            tokenManager.clearToken()

            // Sign out from Firebase
            try {
              await auth.signOut()
            } catch (signOutError) {
              console.error('Error signing out:', signOutError)
            }

            // Only redirect if we're not already on the login page
            const isLoginPage = window.location.pathname === '/login'
            if (!isLoginPage) {
              window.location.href = '/login'
            }
            
            // Clear the promise so subsequent requests can attempt refresh again
            refreshTokenPromise = null
            throw refreshError
          } finally {
            setTimeout(() => {
              refreshTokenPromise = null
            }, 1000) // Increased to 1 second to catch all concurrent requests
          }
        })()
      }

      try {
        // Wait for the refresh to complete (either this request started it or another one did)
        const newAccessToken = await refreshTokenPromise

        // Update the request headers with the new access token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, reject the original request
        return Promise.reject(refreshError)
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
