import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './crypto'

describe('crypto utils', () => {
  it('should hash a password and return hash + salt', async () => {
    const { hash, salt } = await hashPassword('mypassword')
    expect(hash).toBeTruthy()
    expect(salt).toBeTruthy()
    expect(typeof hash).toBe('string')
    expect(typeof salt).toBe('string')
  })

  it('should produce different salts each call', async () => {
    const a = await hashPassword('same')
    const b = await hashPassword('same')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })

  it('should verify correct password', async () => {
    const { hash, salt } = await hashPassword('correct')
    const ok = await verifyPassword('correct', hash, salt)
    expect(ok).toBe(true)
  })

  it('should reject wrong password', async () => {
    const { hash, salt } = await hashPassword('correct')
    const ok = await verifyPassword('wrong', hash, salt)
    expect(ok).toBe(false)
  })

  it('should reject empty password', async () => {
    const { hash, salt } = await hashPassword('correct')
    const ok = await verifyPassword('', hash, salt)
    expect(ok).toBe(false)
  })
})
