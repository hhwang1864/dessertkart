import { Hono } from 'hono'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { isValidPrize } from '../utils/prizes'

const user = new Hono<AuthEnv>()

user.use('/*', authMiddleware)

user.get('/profile', async (c) => {
  const { sub } = c.get('user')
  const row = await c.env.DB.prepare(
    'SELECT id, username, money, owned_carts, equipped_cart FROM users WHERE id = ?'
  ).bind(sub).first<{ id: number; username: string; money: number; owned_carts: string; equipped_cart: string }>()

  if (!row) return c.json({ error: 'User not found' }, 404)

  return c.json({
    id: row.id,
    username: row.username,
    money: row.money,
    owned_carts: JSON.parse(row.owned_carts),
    equipped_cart: row.equipped_cart,
  })
})

user.post('/add-money', async (c) => {
  const { sub } = c.get('user')
  const body = await c.req.json<{ amount?: number }>()
  const amount = body.amount

  if (!isValidPrize(amount)) {
    return c.json({ error: 'Invalid prize amount' }, 400)
  }

  if (amount === 0) {
    const row = await c.env.DB.prepare('SELECT money FROM users WHERE id = ?').bind(sub).first<{ money: number }>()
    return c.json({ money: row?.money ?? 0 })
  }

  const result = await c.env.DB.prepare(
    'UPDATE users SET money = money + ? WHERE id = ? RETURNING money'
  ).bind(amount, sub).first<{ money: number }>()

  return c.json({ money: result?.money ?? 0 })
})

export default user
