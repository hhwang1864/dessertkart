import { describe, it, expect, vi } from 'vitest'
import { authMiddleware } from './auth'
import { signToken } from '../utils/jwt'

const SECRET = 'test-secret'

function makeCtx(authHeader?: string) {
  const user = { value: null as unknown }
  return {
    req: { header: (name: string) => name === 'Authorization' ? authHeader : undefined },
    env: { JWT_SECRET: SECRET, DB: {} },
    json: (body: unknown, status?: number) => ({ body, status }),
    set: (_key: string, val: unknown) => { user.value = val },
    _user: user,
  }
}

describe('authMiddleware', () => {
  it('should return 401 when no Authorization header', async () => {
    const ctx = makeCtx()
    const next = vi.fn()
    const res = await authMiddleware(ctx as never, next)
    expect((res as { status: number }).status).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when header is not Bearer format', async () => {
    const ctx = makeCtx('Basic abc123')
    const next = vi.fn()
    const res = await authMiddleware(ctx as never, next)
    expect((res as { status: number }).status).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 for invalid token', async () => {
    const ctx = makeCtx('Bearer not.a.real.token')
    const next = vi.fn()
    const res = await authMiddleware(ctx as never, next)
    expect((res as { status: number }).status).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next() and set user for valid token', async () => {
    const token = await signToken({ sub: 42, username: 'tester' }, SECRET)
    const ctx = makeCtx(`Bearer ${token}`)
    const next = vi.fn()
    await authMiddleware(ctx as never, next)
    expect(next).toHaveBeenCalled()
    expect((ctx._user.value as { sub: number }).sub).toBe(42)  // middleware converts string→number
  })
})
