import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from './jwt'

const SECRET = 'test-secret-key-for-unit-tests'

describe('JWT utils', () => {
  it('should sign a token and verify it successfully', async () => {
    const token = await signToken({ sub: 1, username: 'alice' }, SECRET)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const payload = await verifyToken(token, SECRET)
    expect(payload).not.toBeNull()
    expect(payload!.sub).toBe('1')
    expect(payload!.username).toBe('alice')
  })

  it('should return null for an invalid token', async () => {
    const payload = await verifyToken('not.a.valid.token', SECRET)
    expect(payload).toBeNull()
  })

  it('should return null when verified with wrong secret', async () => {
    const token = await signToken({ sub: 2, username: 'bob' }, SECRET)
    const payload = await verifyToken(token, 'wrong-secret')
    expect(payload).toBeNull()
  })

  it('should include exp claim in payload', async () => {
    const token = await signToken({ sub: 3, username: 'carol' }, SECRET)
    const payload = await verifyToken(token, SECRET)
    expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
})
