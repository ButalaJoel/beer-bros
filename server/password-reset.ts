import { createHmac, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool } from './db.js'
import { getSessionSecret, issueSession, sessionCookie } from './auth.js'
import { PostgresRateLimitStore } from './rate-limit-store.js'

/**
 * Email one-time codes for "forgot password", without a new database table.
 * A code is an HMAC of the user id, their current password hash and a 10-minute time bucket,
 * so it expires on its own and stops working as soon as the password changes.
 * Requests and wrong guesses are limited per email address in the shared rate-limit table.
 */
export const passwordResetRouter = Router()

const BUCKET_MS = 10 * 60_000
const requestLimiter = new PostgresRateLimitStore('reset-request')
const verifyLimiter = new PostgresRateLimitStore('reset-verify')
requestLimiter.init({ windowMs: 60 * 60_000 } as never)
verifyLimiter.init({ windowMs: 30 * 60_000 } as never)
const MAX_REQUESTS_PER_HOUR = 4
const MAX_GUESSES = 6

const requestBody = z.object({ email: z.string().trim().email().max(254) })
const confirmBody = z.object({ email: z.string().trim().email().max(254), code: z.string().trim().regex(/^\d{6}$/), password: z.string().min(8).max(128) })
const genericSent = { message: 'If that email has a Beer BROS account, we sent it a 6-digit code.' }

function codeFor(userId: string, passwordHash: string, bucket: number) {
  const key = createHmac('sha256', getSessionSecret()).update('beer-bros:password-reset:v1').digest()
  const digest = createHmac('sha256', key).update(`${userId}|${passwordHash}|${bucket}`).digest()
  return String(digest.readUInt32BE(0) % 1_000_000).padStart(6, '0')
}

function codeMatches(userId: string, passwordHash: string, code: string) {
  const bucket = Math.floor(Date.now() / BUCKET_MS)
  return [bucket, bucket - 1].some((b) => timingSafeEqual(Buffer.from(codeFor(userId, passwordHash, b)), Buffer.from(code)))
}

function emailConfigured() { return Boolean(process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL) }

async function sendCodeEmail(to: string, name: string, code: string) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.MAIL_FROM_EMAIL, name: process.env.MAIL_FROM_NAME || 'Beer BROS' },
      to: [{ email: to, name }],
      subject: `${code} is your Beer BROS code`,
      textContent: `Hi ${name},\n\nYour Beer BROS password reset code is ${code}.\nIt expires in about 15 minutes.\n\nIf you didn't ask for this, ignore this email — your password stays the same.`,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px"><h2 style="margin:0 0 12px">Reset your Beer BROS password</h2><p>Hi ${name.replace(/[<>&"]/g, '')},</p><p>Your code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:8px 0 16px">${code}</p><p style="color:#555">It expires in about 15 minutes. If you didn't ask for this, ignore this email — your password stays the same.</p></div>`,
    }),
  })
  if (!response.ok) console.error('Password reset email failed with status', response.status)
}

passwordResetRouter.post('/auth/password-reset/request', async (req, res, next) => {
  try {
    const parsed = requestBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (!emailConfigured()) return res.status(503).json({ error: 'Password reset by email is not switched on yet. Contact the Beer BROS team.' })
    const email = parsed.data.email.toLowerCase()
    const { totalHits } = await requestLimiter.increment(email)
    if (totalHits > MAX_REQUESTS_PER_HOUR) return res.status(429).json({ error: 'Too many codes requested. Try again in an hour.' })
    const result = await pool.query<{ id: string; email: string; password_hash: string; display_name: string }>(
      `SELECT u.id, u.email, u.password_hash, p.display_name FROM users u JOIN profiles p ON p.user_id=u.id
       WHERE lower(u.email)=$1 AND u.deleted_at IS NULL`, [email],
    )
    const user = result.rows[0]
    if (user) await sendCodeEmail(user.email, user.display_name, codeFor(user.id, user.password_hash, Math.floor(Date.now() / BUCKET_MS)))
    return res.json(genericSent)
  } catch (error) { next(error) }
})

passwordResetRouter.post('/auth/password-reset/confirm', async (req, res, next) => {
  try {
    const parsed = confirmBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter the 6-digit code and a new password of at least 8 characters.' })
    const email = parsed.data.email.toLowerCase()
    const { totalHits } = await verifyLimiter.increment(email)
    if (totalHits > MAX_GUESSES) return res.status(429).json({ error: 'Too many wrong codes. Request a new code in 30 minutes.' })
    const result = await pool.query<{ id: string; email: string; password_hash: string; handle: string; display_name: string }>(
      `SELECT u.id, u.email, u.password_hash, p.handle, p.display_name FROM users u JOIN profiles p ON p.user_id=u.id
       WHERE lower(u.email)=$1 AND u.deleted_at IS NULL`, [email],
    )
    const user = result.rows[0]
    if (!user || !codeMatches(user.id, user.password_hash, parsed.data.code)) return res.status(400).json({ error: 'That code is wrong or has expired.' })
    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, user.id])
    await verifyLimiter.resetKey(email)
    res.cookie(sessionCookie.name, issueSession(user.id), sessionCookie.options)
    const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
    return res.json({ user: { id: user.id, email: user.email, handle: user.handle, displayName: user.display_name, isAdmin: admins.includes(user.email.toLowerCase()) } })
  } catch (error) { next(error) }
})
