import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import userRoutes from './user'
import { signToken } from '../utils/jwt'

const SECRET = 'test-secret'

async function makeApp(dbMock: Record<string, unknown>) {
  const app = new Hono<{ Bindings: { DB: unknown; JWT_SECRET: string } }>()
  app.use('/*', async (c, next) => {
    c.env = { DB: dbMock as never, JWT_SECRET: SECRET }
    await next()
  })
  app.route('/', userRoutes)
  return app
}

async function authHeader() {
  const token = await signToken({ sub: 1, username: 'tester' }, SECRET)
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

describe('GET /profile', () => {
  it('should return user profile with valid JWT', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            id: 1, username: 'tester', money: 100,
            owned_carts: '["default"]', equipped_cart: 'default',
          }),
        }),
      }),
    }
    const app = await makeApp(db)
    const headers = await authHeader()
    const res = await app.request('/profile', { headers })
    expect(res.status).toBe(200)
    const data = await res.json() as { money: number; owned_carts: string[] }
    expect(data.money).toBe(100)
    expect(data.owned_carts).toEqual(['default'])
  })

  it('should return 401 without token', async () => {
    const app = await makeApp({})
    const res = await app.request('/profile')
    expect(res.status).toBe(401)
  })
})

describe('POST /add-money', () => {
  it('should reject invalid prize amount with 400', async () => {
    const app = await makeApp({})
    const headers = await authHeader()
    const res = await app.request('/add-money', {
      method: 'POST', headers,
      body: JSON.stringify({ amount: 999 }),
    })
    expect(res.status).toBe(400)
  })

  it('should accept valid prize amount and return new money', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ money: 130 }),
        }),
      }),
    }
    const app = await makeApp(db)
    const headers = await authHeader()
    const res = await app.request('/add-money', {
      method: 'POST', headers,
      body: JSON.stringify({ amount: 30 }),
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { money: number }
    expect(data.money).toBe(130)
  })
})
