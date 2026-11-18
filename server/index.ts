import 'dotenv/config'
import { createServer } from 'node:http'
import { isIP } from 'node:net'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { pool } from './db.js'
import { getSessionCookieName, getSessionSecret } from './auth.js'
import { router } from './routes.js'
import { passwordResetRouter } from './password-reset.js'
import { PostgresRateLimitStore, startRateLimitCleanup } from './rate-limit-store.js'

// Log stray async errors instead of letting one bad request take the whole API offline.
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason instanceof Error ? reason.message : reason))

const app = express()
const server = createServer(app)
/**
 * Requests reach this API through Vercel's rewrite and then Render's own proxies, so req.ip is an
 * internal Render address shared by every visitor. Count each visitor by the client address Vercel
 * passes on instead, falling back to req.ip. A spoofed header only affects that caller's own counter,
 * and logins are also limited per email address below.
 */
function clientKey(req: express.Request) {
  const header = (name: string) => String(req.headers[name] ?? '').split(',')[0].trim()
  const candidate = [header('x-vercel-forwarded-for'), header('x-real-ip'), header('x-forwarded-for')].find((value) => isIP(value))
  return candidate ?? req.ip ?? 'unknown'
}
const limiterDefaults = { standardHeaders: 'draft-8' as const, legacyHeaders: false, keyGenerator: clientKey }
const generalLimiter = rateLimit({ ...limiterDefaults, windowMs: 60_000, limit: 300, store: new PostgresRateLimitStore('general'), message: { error: 'Too many requests. Wait a minute, then try again.' } })
const authLimiter = rateLimit({ ...limiterDefaults, windowMs: 15 * 60_000, limit: 30, store: new PostgresRateLimitStore('auth'), message: { error: 'Too many attempts. Wait 15 minutes, then try again.' } })
const loginEmailLimiter = rateLimit({ ...limiterDefaults, windowMs: 15 * 60_000, limit: 10, skipSuccessfulRequests: true, keyGenerator: (req) => String(req.body?.email ?? '').trim().toLowerCase() || clientKey(req), store: new PostgresRateLimitStore('login-email'), message: { error: 'Too many wrong passwords for this account. Wait 15 minutes, or use “Forgot password?”.' } })
const writeLimiter = rateLimit({ ...limiterDefaults, windowMs: 60_000, limit: 60, store: new PostgresRateLimitStore('writes'), message: { error: 'You’re going a bit fast. Wait a minute, then try again.' } })
const origins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean)
const allowedOrigins = new Set(origins)
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors(corsOptions))
const photoPostJson = express.json({ limit: '1600kb' })
const defaultJson = express.json({ limit: '32kb' })
app.use((req, res, next) => ((req.method === 'POST' && req.path === '/api/stories') || (req.method === 'PATCH' && req.path === '/api/profile/me') ? photoPostJson : defaultJson)(req, res, next))
app.use(cookieParser())
app.use(generalLimiter)

app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.header('origin')
  if (!origin || !allowedOrigins.has(origin)) return res.status(403).json({ error: 'Request origin is not allowed.' })
  return next()
})
app.use('/api/auth', authLimiter)
app.post('/api/auth/login', loginEmailLimiter)
app.use('/api', (req, res, next) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? writeLimiter(req, res, next) : next())
app.use('/api', passwordResetRouter)
app.use('/api', router)
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }))
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (typeof error === 'object' && error !== null && (error as { type?: string }).type === 'entity.too.large') return res.status(413).json({ error: 'That photo is too large. Try a smaller one.' })
  console.error('API request failed:', error instanceof Error ? error.message : 'Unknown error')
  return res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

const io = new SocketServer(server, { cors: { origin: origins, credentials: true }, transports: ['websocket', 'polling'] })
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie ?? ''
  const cookiePair = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${getSessionCookieName()}=`))
  const token = cookiePair ? decodeURIComponent(cookiePair.slice(getSessionCookieName().length + 1)) : undefined
  if (!token) return next(new Error('Authentication required.'))
  try {
    const claims = jwt.verify(token, getSessionSecret(), { issuer: 'beer-bros-api', audience: 'beer-bros-web' })
    if (typeof claims === 'string' || !claims.sub) return next(new Error('Session is invalid.'))
    socket.data.userId = claims.sub
    return next()
  } catch { return next(new Error('Session is invalid or expired.')) }
})

const sendMessageSchema = z.object({ conversationId: z.string().uuid(), body: z.string().trim().min(1).max(2000) })
const socketLimiter = new PostgresRateLimitStore('socket_message')
io.on('connection', (socket) => {
  const userId = socket.data.userId as string
  socket.on('conversation:join', async (conversationId: unknown, acknowledge?: (result: { ok: boolean }) => void) => {
    if (typeof conversationId !== 'string' || !z.string().uuid().safeParse(conversationId).success) return acknowledge?.({ ok: false })
    try {
      const access = await pool.query(
        `SELECT 1 FROM conversations c WHERE c.id=$1 AND (c.participant_a=$2 OR c.participant_b=$2)
         AND EXISTS (SELECT 1 FROM matches m WHERE m.user_a=LEAST(c.participant_a,c.participant_b) AND m.user_b=GREATEST(c.participant_a,c.participant_b))
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END)
           OR (b.blocker_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END AND b.blocked_id=$2))`, [conversationId, userId],
      )
      if (!access.rowCount) return acknowledge?.({ ok: false })
      socket.join(`conversation:${conversationId}`)
      return acknowledge?.({ ok: true })
    } catch { return acknowledge?.({ ok: false }) }
  })

  socket.on('message:send', async (payload: unknown, acknowledge?: (result: { ok: boolean; message?: unknown; error?: string }) => void) => {
    const parsed = sendMessageSchema.safeParse(payload)
    if (!parsed.success) return acknowledge?.({ ok: false, error: 'Message is invalid.' })
    try {
      const rate = await socketLimiter.increment(userId)
      if (rate.totalHits > 20) return acknowledge?.({ ok: false, error: 'Please slow down before sending another message.' })
      const { conversationId, body } = parsed.data
      if (!socket.rooms.has(`conversation:${conversationId}`)) return acknowledge?.({ ok: false, error: 'Join this conversation before sending a message.' })
      const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, body)
         SELECT c.id, $2, $3 FROM conversations c
         WHERE c.id=$1 AND (c.participant_a=$2 OR c.participant_b=$2)
           AND EXISTS (SELECT 1 FROM matches m WHERE m.user_a=LEAST(c.participant_a,c.participant_b) AND m.user_b=GREATEST(c.participant_a,c.participant_b))
           AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END)
             OR (b.blocker_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END AND b.blocked_id=$2))
         RETURNING id, conversation_id, sender_id, body, created_at`, [conversationId, userId, body],
      )
      if (!result.rowCount) return acknowledge?.({ ok: false, error: 'Conversation not found.' })
      const message = result.rows[0]
      io.to(`conversation:${conversationId}`).emit('message:new', message)
      return acknowledge?.({ ok: true, message })
    } catch { return acknowledge?.({ ok: false, error: 'Message could not be sent.' }) }
  })
})

startRateLimitCleanup()

const port = Number(process.env.PORT ?? 3001)
server.listen(port, '0.0.0.0', () => console.log(`Beer BROS API listening on ${port}`))

async function shutdown() {
  io.close()
  await pool.end()
  process.exit(0)
}
process.on('SIGTERM', () => { void shutdown() })
process.on('SIGINT', () => { void shutdown() })
