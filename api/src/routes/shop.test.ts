import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import shopRoutes from './shop'
import { signToken } from '../utils/jwt'

const SECRET = 'test-secret'

async function makeApp(dbMock: Record<string, unknown>) {
  const app = new Hono<{ Bindings: { DB: unknown; JWT_SECRET: string } }>()
  app.use('/*', async (c, next) => {
    c.env = { DB: dbMock as never, JWT_SECRET: SECRET }
    await next()
  })
  app.route('/', shopRoutes)
  return app
}

async function authHeader() {
  const token = await signToken({ sub: 1, username: 'tester' }, SECRET)
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

describe('POST /buy', () => {
  it('should return 400 for invalid cart ID', async () => {
    const app = await makeApp({})
    const headers = await authHeader()
    const res = await app.request('/buy', {
      method: 'POST', headers,
      body: JSON.stringify({ cartId: 'nonexistent' }),
    })
    expect(res.status).toBe(400)
  })

  it('should return 402 for insufficient funds', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ money: 5, owned_carts: '["default"]' }),
        }),
      }),
    }
    const app = await makeApp(db)
    const headers = await authHeader()
    const res = await app.request('/buy', {
      method: 'POST', headers,
      body: JSON.stringify({ cartId: 'dune_runner' }), // costs 50
    })
    expect(res.status).toBe(402)
  })

  it('should return 409 for already-owned cart', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ money: 500, owned_carts: '["default","dune_runner"]' }),
        }),
      }),
    }
    const app = await makeApp(db)
    const headers = await authHeader()
    const res = await app.request('/buy', {
      method: 'POST', headers,
      body: JSON.stringify({ cartId: 'dune_runner' }),
    })
    expect(res.status).toBe(409)
  })

  it('should return 200 with updated wallet on successful purchase', async () => {
    const selectFirst = vi.fn().mockResolvedValue({ money: 200, owned_carts: '["default"]' })
    const updateFirst = vi.fn().mockResolvedValue({
      money: 150, owned_carts: '["default","dune_runner"]', equipped_cart: 'default',
    })
    let callCount = 0
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => callCount++ === 0 ? selectFirst() : updateFirst()),
        }),
      }),
    }
    const app = await makeApp(db)
    const headers = await authHeader()
    const res = await app.request('/buy', {
      method: 'POST', headers,
      body: JSON.stringify({ cartId: 'dune_runner' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { money: number; owned_carts: string[] }
    expect(data.money).toBe(150)
    expect(data.owned_carts).toContain('dune_runner')
  })
})

describe('POST /equip', () => {
  it('should return 403 for unowned cart', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ owned_carts: '["default"]' }),
        }),
      }),
    }
    const app = await makeApp(db)
    const headers = await authHeader()
    const res = await app.request('/equip', {
      method: 'POST', headers,
      body: JSON.stringify({ cartId: 'dune_runner' }),
    })
    expect(res.status).toBe(403)
  })

  it('should return 200 when equipping an owned cart', async () => {
    let callCount = 0
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            if (callCount++ === 0) return Promise.resolve({ owned_carts: '["default","dune_runner"]' })
            return Promise.resolve({ money: 100, owned_carts: '["default","dune_runner"]', equipped_cart: 'dune_runner' })
          }),
        }),
      }),
    }
    const app = await makeApp(db)
    const headers = await authHeader()
    const res = await app.request('/equip', {
      method: 'POST', headers,
      body: JSON.stringify({ cartId: 'dune_runner' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { equipped_cart: string }
    expect(data.equipped_cart).toBe('dune_runner')
  })
})
