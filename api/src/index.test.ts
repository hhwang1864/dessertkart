import { describe, it, expect } from 'vitest'
import app from './index'

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const data = await res.json() as { status: string }
    expect(data.status).toBe('ok')
  })
})

describe('CORS origin policy', () => {
  it('should allow localhost:5173', async () => {
    const res = await app.request('/api/health', {
      headers: { Origin: 'http://localhost:5173' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
  })

  it('should allow any *.pages.dev origin', async () => {
    const res = await app.request('/api/health', {
      headers: { Origin: 'https://dessertkart.pages.dev' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('https://dessertkart.pages.dev')
  })

  it('should block unknown origins', async () => {
    const res = await app.request('/api/health', {
      headers: { Origin: 'https://evil.example.com' },
    })
    const allowOrigin = res.headers.get('access-control-allow-origin')
    expect(allowOrigin).toBeNull()
  })
})
