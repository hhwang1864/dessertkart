import type { Context, Next } from 'hono'
import { verifyToken, type JwtPayload } from '../utils/jwt'

export interface AuthUser {
  sub: number
  username: string
  exp: number
}

export type AuthEnv = {
  Bindings: { DB: D1Database; JWT_SECRET: string }
  Variables: { user: AuthUser }
}

export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const header = c.req.header('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = header.slice(7)
  const payload = await verifyToken(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
  c.set('user', { ...payload, sub: Number(payload.sub) })
  await next()
}
