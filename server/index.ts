import 'dotenv/config'
import { createServer } from 'node:http'
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

const app = express()
const server = createServer(app)
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, store: new PostgresRateLimitStore('auth') })
const writeLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false, store: new PostgresRateLimitStore('writes') })
const origins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean)
const allowedOrigins = new Set(origins)
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors(corsOptions))
const photoPostJson = express.json({ limit: '1600kb' })
const defaultJson = express.json({ limit: '32kb' })
app.use((req, res, next) => (req.method === 'POST' && req.path === '/api/stories' ? photoPostJson : defaultJson)(req, res, next))
app.use(cookieParser())
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false, store: new PostgresRateLimitStore('general') }))

app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.header('origin')
  if (!origin || !allowedOrigins.has(origin)) return res.status(403).json({ error: 'Request origin is not allowed.' })
  return next()
})
app.use('/api/auth', authLimiter)
app.use('/api', (req, res, next) => ['POST', 'PUT', 'DELETE'].includes(req.method) ? writeLimiter(req, res, next) : next())
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
