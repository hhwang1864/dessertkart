import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

import { apiClient, API_BASE_URL } from './api'

describe('apiClient', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetAllMocks()
  })

  it('should make a GET request to the correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await apiClient.get('/api/health')

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/health`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should inject Authorization header when token is present', async () => {
    localStorageMock.setItem('dessertkart_token', 'my.jwt.token')

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await apiClient.get('/api/user/profile')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my.jwt.token',
        }),
      })
    )
  })

  it('should not inject Authorization header when no token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await apiClient.get('/api/health')

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.headers?.Authorization).toBeUndefined()
  })

  it('should make a POST request with JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await apiClient.post('/api/auth/login', { username: 'test', password: 'pass' })

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'test', password: 'pass' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })

  it('should throw an error with the message from the API on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(apiClient.post('/api/auth/login', {})).rejects.toThrow('Invalid credentials')
  })

  it('should throw a generic error when response has no error field', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(apiClient.get('/api/user/profile')).rejects.toThrow('Request failed')
  })
})
