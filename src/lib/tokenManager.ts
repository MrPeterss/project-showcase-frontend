/**
 * In-memory token manager for access tokens
 * Access tokens are stored in memory only (not in localStorage)
 * Refresh tokens are handled via HTTP-only cookies by the backend
 */

let accessToken: string | null = null

export const tokenManager = {
  /**
   * Get the current access token from memory
   */
  getToken: (): string | null => {
    return accessToken
  },

  /**
   * Set the access token in memory
   */
  setToken: (token: string | null): void => {
    accessToken = token
  },

  /**
   * Clear the access token from memory
   */
  clearToken: (): void => {
    accessToken = null
  },

  /**
   * Check if an access token exists
   */
  hasToken: (): boolean => {
    return accessToken !== null
  },
}

