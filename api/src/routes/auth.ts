import { Hono } from 'hono'
import { hashPassword, verifyPassword } from '../utils/crypto'
import { signToken } from '../utils/jwt'
import type { AuthEnv } from '../middleware/auth'

const auth = new Hono<AuthEnv>()

auth.post('/register', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>()
  const { username, password } = body

  if (!username || !password || username.trim().length < 2 || password.length < 4) {
    return c.json({ error: 'Username (min 2 chars) and password (min 4 chars) required' }, 400)
  }

  const { hash, salt } = await hashPassword(password)

  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?) RETURNING id, username, money, owned_carts, equipped_cart'
    ).bind(username.trim(), hash, salt).first<{
      id: number; username: string; money: number; owned_carts: string; equipped_cart: string
    }>()

    if (!result) throw new Error('Insert failed')

    const token = await signToken({ sub: result.id, username: result.username }, c.env.JWT_SECRET)
    return c.json({
      token,
      user: {
        id: result.id,
        username: result.username,
        money: result.money,
        owned_carts: JSON.parse(result.owned_carts),
        equipped_cart: result.equipped_cart,
      },
    }, 201)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return c.json({ error: 'Username already taken' }, 409)
    }
    return c.json({ error: 'Registration failed' }, 500)
  }
})

auth.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>()
  const { username, password } = body

  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, salt, money, owned_carts, equipped_cart FROM users WHERE username = ?'
  ).bind(username.trim()).first<{
    id: number; username: string; password_hash: string; salt: string;
    money: number; owned_carts: string; equipped_cart: string
  }>()

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await verifyPassword(password, user.password_hash, user.salt)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await signToken({ sub: user.id, username: user.username }, c.env.JWT_SECRET)
  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      money: user.money,
      owned_carts: JSON.parse(user.owned_carts),
      equipped_cart: user.equipped_cart,
    },
  })
})

export default auth
