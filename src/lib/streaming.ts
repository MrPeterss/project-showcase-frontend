import { tokenManager } from './tokenManager'

export type SseEventName = string

export type SseEvent = {
  /** SSE "event:" name. Defaults to "message". */
  event: SseEventName
  /** SSE "data:" payload. Multiple data lines are joined with "\n". */
  data: string
  /** Optional SSE "id:" value. */
  id?: string
}

export type SseStreamHandlers = {
  onOpen?: () => void
  onError?: (error: Error) => void
  /** Called for every SSE event (named or default). */
  onEvent?: (evt: SseEvent) => void
  /** Convenience handler for default message events. */
  onMessage?: (data: string) => void
}

export type SseStreamConnection = {
  close: () => void
}

function dispatchSseEvent(handlers: SseStreamHandlers, evt: SseEvent) {
  handlers.onEvent?.(evt)
  if (evt.event === 'message') {
    handlers.onMessage?.(evt.data)
  }
}

/**
 * Creates an authenticated SSE stream using fetch() so we can attach
 * Authorization headers (unlike EventSource).
 *
 * This expects standard SSE framing from the server (lines like `event: foo`, `data: {...}`
 * separated by a blank line).
 */
export function createSseStream(
  url: string,
  handlers: SseStreamHandlers = {}
): SseStreamConnection {
  const abort = new AbortController()

  const accessToken = tokenManager.getToken()
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }

  ;(async () => {
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: abort.signal,
      })

      if (!resp.ok) {
        throw new Error(`SSE request failed: ${resp.status} ${resp.statusText}`)
      }
      if (!resp.body) {
        throw new Error('SSE response has no body')
      }

      handlers.onOpen?.()

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()

      let buffer = ''
      let eventName: string | undefined
      let eventId: string | undefined
      let dataLines: string[] = []

      const flush = () => {
        if (dataLines.length === 0 && !eventName && !eventId) return
        const evt: SseEvent = {
          event: eventName ?? 'message',
          data: dataLines.join('\n'),
          ...(eventId ? { id: eventId } : {}),
        }
        eventName = undefined
        eventId = undefined
        dataLines = []
        dispatchSseEvent(handlers, evt)
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Process by lines; keep partial line in buffer
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          // Blank line indicates end of event
          if (line === '') {
            flush()
            continue
          }

          // Comment line (heartbeat) like ": keepalive"
          if (line.startsWith(':')) {
            continue
          }

          // Field parsing: "field: value" or "field:"
          const idx = line.indexOf(':')
          const field = idx === -1 ? line : line.slice(0, idx)
          const valueRaw = idx === -1 ? '' : line.slice(idx + 1)
          const value = valueRaw.startsWith(' ') ? valueRaw.slice(1) : valueRaw

          if (field === 'event') {
            eventName = value
          } else if (field === 'data') {
            dataLines.push(value)
          } else if (field === 'id') {
            eventId = value
          } else {
            // ignore retry/unknown
          }
        }
      }

      // Flush any trailing event
      flush()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const error = err instanceof Error ? err : new Error('SSE stream error')
      handlers.onError?.(error)
    }
  })()

  return {
    close: () => abort.abort(),
  }
}

