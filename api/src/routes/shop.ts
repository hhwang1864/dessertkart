import { Hono } from 'hono'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { KART_CATALOG, isValidCartId, canAfford, alreadyOwns } from '../utils/catalog'

const shop = new Hono<AuthEnv>()

shop.use('/*', authMiddleware)

shop.post('/buy', async (c) => {
  const { sub } = c.get('user')
  const body = await c.req.json<{ cartId?: string }>()
  const { cartId } = body

  if (!isValidCartId(cartId)) {
    return c.json({ error: 'Invalid cart ID' }, 400)
  }

  const kart = KART_CATALOG.get(cartId)!
  const user = await c.env.DB.prepare(
    'SELECT money, owned_carts FROM users WHERE id = ?'
  ).bind(sub).first<{ money: number; owned_carts: string }>()

  if (!user) return c.json({ error: 'User not found' }, 404)

  const owned: string[] = JSON.parse(user.owned_carts)
  if (alreadyOwns(owned, cartId)) {
    return c.json({ error: 'Cart already owned' }, 409)
  }
  if (!canAfford(user.money, cartId)) {
    return c.json({ error: 'Insufficient funds' }, 402)
  }

  owned.push(cartId)
  // WHERE clause includes money check to prevent TOCTOU race (double-purchase)
  const result = await c.env.DB.prepare(
    'UPDATE users SET money = money - ?, owned_carts = ? WHERE id = ? AND money >= ? RETURNING money, owned_carts, equipped_cart'
  ).bind(kart.price, JSON.stringify(owned), sub, kart.price).first<{ money: number; owned_carts: string; equipped_cart: string }>()

  if (!result) return c.json({ error: 'Purchase failed — insufficient funds or concurrent request' }, 402)

  return c.json({
    money: result.money,
    owned_carts: JSON.parse(result.owned_carts),
    equipped_cart: result.equipped_cart,
  })
})

shop.post('/equip', async (c) => {
  const { sub } = c.get('user')
  const body = await c.req.json<{ cartId?: string }>()
  const { cartId } = body

  if (!isValidCartId(cartId)) {
    return c.json({ error: 'Invalid cart ID' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT owned_carts FROM users WHERE id = ?'
  ).bind(sub).first<{ owned_carts: string }>()

  if (!user) return c.json({ error: 'User not found' }, 404)

  const owned: string[] = JSON.parse(user.owned_carts)
  if (!alreadyOwns(owned, cartId)) {
    return c.json({ error: 'Cart not owned' }, 403)
  }

  const result = await c.env.DB.prepare(
    'UPDATE users SET equipped_cart = ? WHERE id = ? RETURNING money, owned_carts, equipped_cart'
  ).bind(cartId, sub).first<{ money: number; owned_carts: string; equipped_cart: string }>()

  return c.json({
    money: result!.money,
    owned_carts: JSON.parse(result!.owned_carts),
    equipped_cart: result!.equipped_cart,
  })
})

export default shop
