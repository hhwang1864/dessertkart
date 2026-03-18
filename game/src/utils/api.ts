import { TOKEN_KEY } from './auth'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${url}`, options)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? 'Request failed')
  }
  return data as T
}

export const apiClient = {
  get<T>(url: string): Promise<T> {
    return request<T>(url, {
      method: 'GET',
      headers: buildHeaders(),
    })
  },

  post<T>(url: string, body: unknown): Promise<T> {
    const headers = buildHeaders()
    return request<T>(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  },
}
