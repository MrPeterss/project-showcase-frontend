import { tokenManager } from './tokenManager'

/**
 * Creates an EventSource connection for Server-Sent Events (SSE) streaming
 * Handles authentication by including the access token in the URL query params
 * (EventSource doesn't support custom headers)
 */
export function createEventSource(
  url: string,
  onMessage: (data: string) => void,
  onError?: (error: Event) => void,
  onOpen?: () => void
): EventSource {
  const accessToken = tokenManager.getToken()
  
  // Add token to URL since EventSource doesn't support custom headers
  const separator = url.includes('?') ? '&' : '?'
  const urlWithToken = accessToken
    ? `${url}${separator}token=${encodeURIComponent(accessToken)}`
    : url

  const eventSource = new EventSource(urlWithToken)

  eventSource.onmessage = (event) => {
    onMessage(event.data)
  }

  eventSource.onerror = (error) => {
    if (onError) {
      onError(error)
    }
    // EventSource will automatically try to reconnect on error
    // Close if we want to stop retrying
  }

  if (onOpen) {
    eventSource.onopen = onOpen
  }

  return eventSource
}

/**
 * Closes an EventSource connection
 */
export function closeEventSource(eventSource: EventSource | null): void {
  if (eventSource) {
    eventSource.close()
  }
}

