import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import authRoutes from './auth'

const SECRET = 'test-secret'

function makeApp(dbMock: Record<string, unknown>) {
  const app = new Hono<{ Bindings: { DB: unknown; JWT_SECRET: string } }>()
  app.use('/*', async (c, next) => {
    c.env = { DB: dbMock as never, JWT_SECRET: SECRET }
    await next()
  })
  app.route('/', authRoutes)
  return app
}

const baseUser = {
  id: 1, username: 'tester', money: 0,
  owned_carts: '["default"]', equipped_cart: 'default',
}

describe('POST /register', () => {
  it('should return 201 with token and user on success', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(baseUser) }),
      }),
    }
    const app = makeApp(db)
    const res = await app.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tester', password: 'pass1234' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json() as { token: string; user: { username: string } }
    expect(data.token).toBeTruthy()
    expect(data.user.username).toBe('tester')
  })

  it('should return 409 for duplicate username', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed')),
        }),
      }),
    }
    const app = makeApp(db)
    const res = await app.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tester', password: 'pass1234' }),
    })
    expect(res.status).toBe(409)
  })

  it('should return 400 for short username', async () => {
    const app = makeApp({})
    const res = await app.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'x', password: 'pass1234' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /login', () => {
  it('should return 401 for unknown username', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      }),
    }
    const app = makeApp(db)
    const res = await app.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nobody', password: 'pass' }),
    })
    expect(res.status).toBe(401)
  })

  it('should return 400 when fields are missing', async () => {
    const app = makeApp({})
    const res = await app.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tester' }),
    })
    expect(res.status).toBe(400)
  })
})
