import { QueryClient, type DefaultOptions } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import type { ApiError } from './api'

// Default options for all queries
const queryConfig: DefaultOptions = {
  queries: {
    // Time in milliseconds that data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Time in milliseconds that unused data remains in cache
    gcTime: 10 * 60 * 1000, // 10 minutes
    
    // Minimal retries to reduce unnecessary requests
    retry: 1,
    
    // Retry delay
    retryDelay: 1000,
    
    // Don't refetch on window focus (major performance improvement)
    refetchOnWindowFocus: false,
    
    // Don't refetch on reconnect unless necessary
    refetchOnReconnect: false,
    
    // Only refetch on mount if data is stale
    refetchOnMount: false,
  },
  mutations: {
    retry: 0,
  },
}

// Create the query client
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

export const queryKeys = {
  auth: {
    user: () => ['auth', 'user'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },
}

// Helper function to handle query errors
export const handleQueryError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: error.code,
      details: error.response?.data,
    }
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }
  
  return {
    message: 'An unknown error occurred',
  }
}

export default queryClient
