/// <reference types="vite/client" />

export type CurrentUser = { id: string; email: string; handle: string; displayName: string; isAdmin: boolean; avatarUrl?: string | null }

const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

/** Media paths from the API (/api/...) need the API host when the app and API run on different origins. */
export const mediaUrl = (url?: string | null) => (url && url.startsWith('/api/') ? `${base}${url}` : url ?? null)

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { message = (await response.json()).error ?? message } catch { /* response may have no JSON body */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
