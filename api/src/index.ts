import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import shopRoutes from './routes/shop'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/*', cors({
  origin: ['http://localhost:5173', 'https://dessertkart.pages.dev'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/api/health', (c) => c.json({ status: 'ok', game: 'DessertKart' }))

app.route('/api/auth', authRoutes)
app.route('/api/user', userRoutes)
app.route('/api/shop', shopRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => c.json({ error: err.message }, 500))

export default app
