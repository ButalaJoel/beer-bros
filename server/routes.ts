import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool } from './db.js'
import { issueSession, requireAuth, sessionCookie } from './auth.js'

export const router = Router()
const registerBody = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  handle: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().trim().min(1).max(60),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  acceptedResponsibleUse: z.literal(true),
})
const loginBody = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) })
const storyBody = z.object({ body: z.string().trim().min(1).max(500), topicTags: z.array(z.string().trim().min(1).max(32)).max(5).optional() })
const commentBody = z.object({ body: z.string().trim().min(1).max(500) })
const messageBody = z.object({ body: z.string().trim().min(1).max(2000) })

function isAdult(dateOfBirth: string) {
  const date = new Date(`${dateOfBirth}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateOfBirth) return false
  const today = new Date()
  let age = today.getUTCFullYear() - date.getUTCFullYear()
  const monthDifference = today.getUTCMonth() - date.getUTCMonth()
  if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < date.getUTCDate())) age--
  return age >= 18 && date <= today
}

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'beer-bros-api' }))

router.post('/auth/register', async (req, res, next) => {
  try {
    const parsed = registerBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Check the account details and try again.' })
    const { email, password, handle, displayName, dateOfBirth } = parsed.data
    if (!isAdult(dateOfBirth)) return res.status(403).json({ error: 'Beer BROS is only available to adults aged 18 and over.' })
    const passwordHash = await bcrypt.hash(password, 12)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const created = await client.query<{ id: string; email: string }>(
        'INSERT INTO users (email, password_hash, date_of_birth) VALUES ($1, $2, $3) RETURNING id, email',
        [email.toLowerCase(), passwordHash, dateOfBirth],
      )
      const user = created.rows[0]
      await client.query('INSERT INTO profiles (user_id, handle, display_name) VALUES ($1, $2, $3)', [user.id, handle.toLowerCase(), displayName.trim()])
      await client.query('COMMIT')
      res.cookie(sessionCookie.name, issueSession(user.id), sessionCookie.options)
      return res.status(201).json({ user: { id: user.id, email: user.email, handle: handle.toLowerCase(), displayName: displayName.trim() } })
    } catch (error) {
      await client.query('ROLLBACK')
      if ((error as { code?: string }).code === '23505') return res.status(409).json({ error: 'That email or username is already in use.' })
      throw error
    } finally { client.release() }
  } catch (error) { next(error) }
})

router.post('/auth/login', async (req, res, next) => {
  try {
    const parsed = loginBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' })
    const result = await pool.query<{ id: string; email: string; password_hash: string; handle: string; display_name: string }>(
      `SELECT u.id, u.email, u.password_hash, p.handle, p.display_name FROM users u
       JOIN profiles p ON p.user_id = u.id WHERE lower(u.email) = $1 AND u.deleted_at IS NULL`, [parsed.data.email.toLowerCase()],
    )
    if (!result.rowCount || !(await bcrypt.compare(parsed.data.password, result.rows[0].password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' })
    const { id, email, handle, display_name } = result.rows[0]
    res.cookie(sessionCookie.name, issueSession(id), sessionCookie.options)
    return res.json({ user: { id, email, handle, displayName: display_name } })
  } catch (error) { next(error) }
})

router.post('/auth/logout', (_req, res) => { res.clearCookie(sessionCookie.name, { ...sessionCookie.options, maxAge: undefined }); res.status(204).end() })
router.get('/auth/me', requireAuth, (req, res) => res.json({ user: { id: req.user!.id, email: req.user!.email, handle: req.user!.handle, displayName: req.user!.display_name } }))

router.get('/stories', requireAuth, async (req, res, next) => {
  try {
    const followingOnly = req.query.feed === 'following'
    const result = await pool.query(
      `SELECT s.id, s.author_id, s.body, s.topic_tags, s.created_at, p.handle, p.display_name, p.avatar_url, p.broad_area,
        (SELECT count(*)::int FROM story_likes l WHERE l.story_id=s.id) AS like_count,
        (SELECT count(*)::int FROM story_comments c WHERE c.story_id=s.id AND c.deleted_at IS NULL) AS reply_count,
        EXISTS (SELECT 1 FROM story_likes mine WHERE mine.story_id=s.id AND mine.user_id=$1) AS liked_by_me,
        EXISTS (SELECT 1 FROM follows mine WHERE mine.follower_id=$1 AND mine.followed_id=s.author_id) AS followed_by_me,
        (s.author_id=$1) AS own_story
       FROM stories s JOIN profiles p ON p.user_id=s.author_id
       WHERE s.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=s.author_id) OR (b.blocker_id=s.author_id AND b.blocked_id=$1))
         AND ($2::boolean = false OR s.author_id=$1 OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.followed_id=s.author_id))
       ORDER BY s.created_at DESC LIMIT 30`, [req.user!.id, followingOnly],
    )
    return res.json({ stories: result.rows })
  } catch (error) { next(error) }
})

router.post('/stories', requireAuth, async (req, res, next) => {
  try {
    const parsed = storyBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Stories must contain 1–500 characters and up to five short topics.' })
    const result = await pool.query(
      'INSERT INTO stories (author_id, body, topic_tags) VALUES ($1, $2, $3) RETURNING id, body, topic_tags, created_at',
      [req.user!.id, parsed.data.body, parsed.data.topicTags ?? []],
    )
    return res.status(201).json({ story: result.rows[0] })
  } catch (error) { next(error) }
})

router.post('/stories/:storyId/likes', requireAuth, async (req, res, next) => {
  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const story = await client.query<{ author_id: string }>('SELECT author_id FROM stories WHERE id=$1 AND deleted_at IS NULL FOR UPDATE', [req.params.storyId])
      if (!story.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Story not found.' }) }
      const blocked = await client.query('SELECT 1 FROM blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)', [req.user!.id, story.rows[0].author_id])
      if (blocked.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Story not found.' }) }
      await client.query('INSERT INTO story_likes (story_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.storyId, req.user!.id])
      await client.query('COMMIT')
      return res.status(204).end()
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
  } catch (error) { next(error) }
})

router.delete('/stories/:storyId/likes', requireAuth, async (req, res, next) => {
  try { await pool.query('DELETE FROM story_likes WHERE story_id=$1 AND user_id=$2', [req.params.storyId, req.user!.id]); return res.status(204).end() }
  catch (error) { next(error) }
})

router.get('/stories/:storyId/comments', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.body, c.created_at, p.handle, p.display_name, p.avatar_url
       FROM story_comments c JOIN stories s ON s.id=c.story_id JOIN profiles p ON p.user_id=c.author_id
       WHERE c.story_id=$1 AND c.deleted_at IS NULL AND s.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=s.author_id) OR (b.blocker_id=s.author_id AND b.blocked_id=$2))
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=c.author_id) OR (b.blocker_id=c.author_id AND b.blocked_id=$2))
       ORDER BY c.created_at ASC LIMIT 100`, [req.params.storyId, req.user!.id],
    )
    return res.json({ comments: result.rows })
  } catch (error) { next(error) }
})

router.post('/stories/:storyId/comments', requireAuth, async (req, res, next) => {
  try {
    const parsed = commentBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Replies must contain 1–500 characters.' })
    const result = await pool.query(
      `INSERT INTO story_comments (story_id, author_id, body)
       SELECT s.id, $2, $3 FROM stories s
       WHERE s.id=$1 AND s.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=s.author_id) OR (b.blocker_id=s.author_id AND b.blocked_id=$2))
       RETURNING id, story_id, author_id, body, created_at`, [req.params.storyId, req.user!.id, parsed.data.body],
    )
    if (!result.rowCount) return res.status(404).json({ error: 'Story not found.' })
    return res.status(201).json({ comment: result.rows[0] })
  } catch (error) { next(error) }
})

router.post('/users/:userId/follow', requireAuth, async (req, res, next) => {
  try {
    if (req.params.userId === req.user!.id) return res.status(400).json({ error: 'You cannot follow your own account.' })
    const result = await pool.query(
      `INSERT INTO follows (follower_id, followed_id)
       SELECT $1, p.user_id FROM profiles p JOIN users u ON u.id=p.user_id
       WHERE p.user_id=$2 AND u.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=$2) OR (b.blocker_id=$2 AND b.blocked_id=$1))
       ON CONFLICT DO NOTHING RETURNING followed_id`, [req.user!.id, req.params.userId],
    )
    if (!result.rowCount) return res.status(404).json({ error: 'Account not found or unavailable.' })
    return res.status(204).end()
  } catch (error) { next(error) }
})

router.delete('/users/:userId/follow', requireAuth, async (req, res, next) => {
  try { await pool.query('DELETE FROM follows WHERE follower_id=$1 AND followed_id=$2', [req.user!.id, req.params.userId]); return res.status(204).end() }
  catch (error) { next(error) }
})

router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const query = String(req.query.q ?? '').trim().slice(0, 80)
    if (!query) return res.json({ people: [], stories: [] })
    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`
    const [people, matchingStories] = await Promise.all([
      pool.query(
        `SELECT p.user_id AS id, p.handle, p.display_name, p.bio, p.avatar_url, p.broad_area,
           EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.followed_id=p.user_id) AS followed_by_me
         FROM profiles p JOIN users u ON u.id=p.user_id WHERE u.deleted_at IS NULL AND p.user_id<>$1
           AND (p.handle ILIKE $2 OR p.display_name ILIKE $2 OR p.bio ILIKE $2)
           AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.user_id) OR (b.blocker_id=p.user_id AND b.blocked_id=$1))
         ORDER BY p.display_name LIMIT 20`, [req.user!.id, pattern],
      ),
      pool.query(
        `SELECT s.id, s.author_id, s.body, s.topic_tags, s.created_at, p.handle, p.display_name, p.avatar_url, p.broad_area,
           (SELECT count(*)::int FROM story_likes l WHERE l.story_id=s.id) AS like_count,
           (SELECT count(*)::int FROM story_comments c WHERE c.story_id=s.id AND c.deleted_at IS NULL) AS reply_count,
           EXISTS (SELECT 1 FROM story_likes mine WHERE mine.story_id=s.id AND mine.user_id=$1) AS liked_by_me,
           EXISTS (SELECT 1 FROM follows mine WHERE mine.follower_id=$1 AND mine.followed_id=s.author_id) AS followed_by_me,
           (s.author_id=$1) AS own_story
         FROM stories s JOIN profiles p ON p.user_id=s.author_id
         WHERE s.deleted_at IS NULL AND (s.body ILIKE $2 OR EXISTS (SELECT 1 FROM unnest(s.topic_tags) tag WHERE tag ILIKE $2))
           AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=s.author_id) OR (b.blocker_id=s.author_id AND b.blocked_id=$1))
         ORDER BY s.created_at DESC LIMIT 30`, [req.user!.id, pattern],
      ),
    ])
    return res.json({ people: people.rows, stories: matchingStories.rows })
  } catch (error) { next(error) }
})

router.post('/users/:userId/block', requireAuth, async (req, res, next) => {
  try {
    if (req.params.userId === req.user!.id) return res.status(400).json({ error: 'You cannot block your own account.' })
    const result = await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id)
       SELECT $1, id FROM users WHERE id=$2 AND deleted_at IS NULL ON CONFLICT DO NOTHING RETURNING blocked_id`, [req.user!.id, req.params.userId],
    )
    if (!result.rowCount) return res.status(404).json({ error: 'Account not found.' })
    await pool.query('DELETE FROM follows WHERE (follower_id=$1 AND followed_id=$2) OR (follower_id=$2 AND followed_id=$1)', [req.user!.id, req.params.userId])
    return res.status(204).end()
  } catch (error) { next(error) }
})

router.delete('/users/:userId/block', requireAuth, async (req, res, next) => {
  try { await pool.query('DELETE FROM blocks WHERE blocker_id=$1 AND blocked_id=$2', [req.user!.id, req.params.userId]); return res.status(204).end() }
  catch (error) { next(error) }
})

router.post('/reports', requireAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ targetUserId: z.string().uuid().optional(), targetStoryId: z.string().uuid().optional(), reason: z.string().min(3).max(80), details: z.string().max(1000).default('') }).refine((value) => value.targetUserId || value.targetStoryId).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose a profile or story to report and include a reason.' })
    const result = await pool.query(
      `INSERT INTO reports (reporter_id, target_user_id, target_story_id, reason, details)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, status, created_at`,
      [req.user!.id, parsed.data.targetUserId ?? null, parsed.data.targetStoryId ?? null, parsed.data.reason, parsed.data.details],
    )
    return res.status(201).json({ report: result.rows[0] })
  } catch (error) { next(error) }
})

router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, other.id AS other_user_id, p.handle, p.display_name, p.avatar_url,
         (SELECT body FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
       FROM conversations c
       JOIN users other ON other.id=CASE WHEN c.participant_a=$1 THEN c.participant_b ELSE c.participant_a END AND other.deleted_at IS NULL
       JOIN profiles p ON p.user_id=other.id
       WHERE (c.participant_a=$1 OR c.participant_b=$1)
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=other.id) OR (b.blocker_id=other.id AND b.blocked_id=$1))
       ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC LIMIT 50`, [req.user!.id],
    )
    return res.json({ conversations: result.rows })
  } catch (error) { next(error) }
})

router.post('/conversations', requireAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ otherUserId: z.string().uuid() }).safeParse(req.body)
    if (!parsed.success || parsed.data.otherUserId === req.user!.id) return res.status(400).json({ error: 'Choose another account to message.' })
    const [a, b] = [req.user!.id, parsed.data.otherUserId].sort()
    const result = await pool.query<{ id: string }>(
      `INSERT INTO conversations (participant_a, participant_b)
       SELECT $1,$2 WHERE EXISTS (SELECT 1 FROM users WHERE id=$2 AND deleted_at IS NULL)
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1))
       ON CONFLICT (participant_a, participant_b) DO UPDATE SET participant_a=EXCLUDED.participant_a
       RETURNING id`, [a, b],
    )
    if (!result.rowCount) return res.status(404).json({ error: 'That conversation is unavailable.' })
    return res.status(201).json({ conversationId: result.rows[0].id })
  } catch (error) { next(error) }
})

router.get('/conversations/:conversationId/messages', requireAuth, async (req, res, next) => {
  try {
    const allowed = await pool.query(
      `SELECT 1 FROM conversations c WHERE c.id=$1 AND (c.participant_a=$2 OR c.participant_b=$2)
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END)
         OR (b.blocker_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END AND b.blocked_id=$2))`, [req.params.conversationId, req.user!.id],
    )
    if (!allowed.rowCount) return res.status(404).json({ error: 'Conversation not found.' })
    const result = await pool.query(
      `SELECT id, sender_id, body, created_at FROM messages
       WHERE conversation_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`, [req.params.conversationId],
    )
    return res.json({ messages: result.rows.reverse() })
  } catch (error) { next(error) }
})

router.post('/conversations/:conversationId/messages', requireAuth, async (req, res, next) => {
  try {
    const parsed = messageBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Messages must contain 1–2,000 characters.' })
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body)
       SELECT c.id, $2, $3 FROM conversations c
       WHERE c.id=$1 AND (c.participant_a=$2 OR c.participant_b=$2)
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END)
           OR (b.blocker_id=CASE WHEN c.participant_a=$2 THEN c.participant_b ELSE c.participant_a END AND b.blocked_id=$2))
       RETURNING id, conversation_id, sender_id, body, created_at`, [req.params.conversationId, req.user!.id, parsed.data.body],
    )
    if (!result.rowCount) return res.status(404).json({ error: 'Conversation not found.' })
    return res.status(201).json({ message: result.rows[0] })
  } catch (error) { next(error) }
})
