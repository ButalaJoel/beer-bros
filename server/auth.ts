import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'
import type { AuthUser } from './types.js'

const cookieName = 'beer_bros_session'
const secret = process.env.JWT_SECRET
if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters')

export const sessionCookie = {
  name: cookieName,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}

export function issueSession(userId: string) {
  return jwt.sign({ sub: userId }, secret!, { expiresIn: '7d', issuer: 'beer-bros-api', audience: 'beer-bros-web' })
}

function tokenFromRequest(req: Request) {
  const bearer = req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  return req.cookies?.[cookieName] ?? bearer
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = tokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Authentication required.' })
    const claims = jwt.verify(token, secret!, { issuer: 'beer-bros-api', audience: 'beer-bros-web' })
    if (typeof claims === 'string' || !claims.sub) return res.status(401).json({ error: 'Session is invalid.' })
    const result = await pool.query<AuthUser>(
      `SELECT u.id, u.email, p.handle, p.display_name FROM users u
       JOIN profiles p ON p.user_id = u.id WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [claims.sub],
    )
    if (!result.rowCount) return res.status(401).json({ error: 'Account is unavailable.' })
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
    req.user = { ...result.rows[0], is_admin: adminEmails.includes(result.rows[0].email.toLowerCase()) }
    next()
  } catch {
    return res.status(401).json({ error: 'Session is invalid or expired.' })
  }
}

/** Like requireAuth, but lets visitors without an account through as guests (req.user stays undefined). */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (!tokenFromRequest(req)) return next()
  try {
    const claims = jwt.verify(tokenFromRequest(req)!, secret!, { issuer: 'beer-bros-api', audience: 'beer-bros-web' })
    if (typeof claims === 'string' || !claims.sub) return next()
    const result = await pool.query<AuthUser>(
      `SELECT u.id, u.email, p.handle, p.display_name FROM users u
       JOIN profiles p ON p.user_id = u.id WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [claims.sub],
    )
    if (result.rowCount) {
      const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
      req.user = { ...result.rows[0], is_admin: adminEmails.includes(result.rows[0].email.toLowerCase()) }
    }
    next()
  } catch { next() }
}

export function getSessionSecret() { return secret! }
export function getSessionCookieName() { return cookieName }
