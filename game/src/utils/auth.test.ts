import { describe, it, expect, beforeEach, vi } from 'vitest'

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

import { getToken, setToken, clearToken, TOKEN_KEY } from './auth'

describe('auth utilities', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('should return null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('should store a token and retrieve it', () => {
    setToken('test.jwt.token')
    expect(getToken()).toBe('test.jwt.token')
  })

  it('should clear stored token', () => {
    setToken('test.jwt.token')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('should use the correct localStorage key', () => {
    setToken('abc123')
    expect(localStorageMock.getItem(TOKEN_KEY)).toBe('abc123')
  })

  it('should overwrite existing token on setToken', () => {
    setToken('first-token')
    setToken('second-token')
    expect(getToken()).toBe('second-token')
  })
})
