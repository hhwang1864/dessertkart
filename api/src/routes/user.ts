import { Hono } from 'hono'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { isValidPrize } from '../utils/prizes'

const user = new Hono<AuthEnv>()

user.use('/*', authMiddleware)

user.get('/profile', async (c) => {
  const { sub } = c.get('user')
  const row = await c.env.DB.prepare(
    'SELECT id, username, money, boosts, owned_carts, equipped_cart FROM users WHERE id = ?'
  ).bind(sub).first<{ id: number; username: string; money: number; boosts: number; owned_carts: string; equipped_cart: string }>()

  if (!row) return c.json({ error: 'User not found' }, 404)

  return c.json({
    id: row.id,
    username: row.username,
    money: row.money,
    boosts: row.boosts,
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

/** Spend money (for fuel, boosts, etc.). Amount must be positive and <= user's balance. */
user.post('/spend-money', async (c) => {
  const { sub } = c.get('user')
  const body = await c.req.json<{ amount?: number }>()
  const amount = body.amount

  if (typeof amount !== 'number' || amount <= 0 || amount > 1000) {
    return c.json({ error: 'Invalid amount' }, 400)
  }

  // Atomic deduction with balance check
  const result = await c.env.DB.prepare(
    'UPDATE users SET money = money - ? WHERE id = ? AND money >= ? RETURNING money'
  ).bind(amount, sub, amount).first<{ money: number }>()

  if (!result) {
    return c.json({ error: 'Insufficient funds' }, 402)
  }

  return c.json({ money: result.money })
})

const BOOST_PRICE = 10

/** Buy one speed boost for $10. Atomically deducts money and increments boosts. */
user.post('/buy-boost', async (c) => {
  const { sub } = c.get('user')

  const result = await c.env.DB.prepare(
    'UPDATE users SET money = money - ?, boosts = boosts + 1 WHERE id = ? AND money >= ? RETURNING money, boosts'
  ).bind(BOOST_PRICE, sub, BOOST_PRICE).first<{ money: number; boosts: number }>()

  if (!result) {
    return c.json({ error: 'Insufficient funds' }, 402)
  }

  return c.json({ money: result.money, boosts: result.boosts })
})

/** Use one speed boost. Atomically decrements boosts if available. */
user.post('/use-boost', async (c) => {
  const { sub } = c.get('user')

  const result = await c.env.DB.prepare(
    'UPDATE users SET boosts = boosts - 1 WHERE id = ? AND boosts > 0 RETURNING boosts'
  ).bind(sub).first<{ boosts: number }>()

  if (!result) {
    return c.json({ error: 'No boosts available' }, 409)
  }

  return c.json({ boosts: result.boosts })
})

export default user
