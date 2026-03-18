import jwt from '@tsndr/cloudflare-worker-jwt'

export interface JwtPayload {
  sub: string
  username: string
  exp: number
}

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7

export async function signToken(payload: { sub: number; username: string }, secret: string): Promise<string> {
  return jwt.sign(
    { sub: String(payload.sub), username: payload.username, exp: Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS },
    secret
  )
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const valid = await jwt.verify(token, secret)
    if (!valid) return null
    const decoded = jwt.decode<JwtPayload>(token)
    return decoded.payload ?? null
  } catch {
    return null
  }
}
