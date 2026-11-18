import { FormEvent, useState } from 'react'
import { Ban, Check, Flag, Heart, MessageCircle, MoreHorizontal, Pin, PinOff, Repeat2, Share, Trash2, UserPlus, X } from 'lucide-react'
import { api } from '../../lib/api/client'
import Avatar from '../../components/Avatar'

export type StoryRow = {
  id: string; body: string; topic_tags: string[]; created_at: string; has_image?: boolean
  handle: string; display_name: string; avatar_url?: string | null; broad_area?: string | null
  like_count: number; reply_count: number; repost_count?: number
  liked_by_me: boolean; reposted_by_me?: boolean; author_id: string; followed_by_me: boolean; own_story?: boolean
  reposted_by_handle?: string | null; reposted_by_name?: string | null; pinned?: boolean
}
type Comment = { id: string; body: string; handle: string; display_name: string; created_at: string; own_comment?: boolean }
type SetRows = (update: (rows: StoryRow[]) => StoryRow[]) => void

const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
export const timeAgo = (value: string) => { const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); return mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : mins < 10080 ? `${Math.floor(mins / 1440)}d` : new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
export const errorText = (reason: unknown, fallback: string) => reason instanceof Error ? reason.message : fallback
export const rowKey = (story: StoryRow) => `${story.id}:${story.reposted_by_handle ?? ''}`

/** Like, repost, follow, delete and pin, shared by the feed and profile pages. Updates rows optimistically. */
export function useStoryActions({ setRows, guest, onRequireAccount, notify }: { setRows: SetRows; guest: boolean; onRequireAccount: (reason: string) => void; notify: (text: string) => void }) {
  const patch = (id: string, change: (story: StoryRow) => Partial<StoryRow>) => setRows((rows) => rows.map((row) => row.id === id ? { ...row, ...change(row) } : row))
  return {
    async toggleLike(story: StoryRow) {
      if (guest) return onRequireAccount('Create a free account to like posts.')
      const liked = !story.liked_by_me
      patch(story.id, (row) => ({ liked_by_me: liked, like_count: row.like_count + (liked ? 1 : -1) }))
      try { await api(`/stories/${story.id}/likes`, { method: liked ? 'POST' : 'DELETE' }) }
      catch (reason) { patch(story.id, (row) => ({ liked_by_me: !liked, like_count: row.like_count + (liked ? -1 : 1) })); notify(errorText(reason, 'Could not update like.')) }
    },
    async toggleRepost(story: StoryRow) {
      if (guest) return onRequireAccount('Create a free account to repost.')
      const reposted = !story.reposted_by_me
      patch(story.id, (row) => ({ reposted_by_me: reposted, repost_count: (row.repost_count ?? 0) + (reposted ? 1 : -1) }))
      try { await api(`/stories/${story.id}/reposts`, { method: reposted ? 'POST' : 'DELETE' }); notify(reposted ? 'Reposted to your profile.' : 'Repost removed.') }
      catch (reason) { patch(story.id, (row) => ({ reposted_by_me: !reposted, repost_count: (row.repost_count ?? 0) + (reposted ? -1 : 1) })); notify(errorText(reason, 'Could not repost.')) }
    },
    async follow(userId: string, isFollowing: boolean) {
      if (guest) return onRequireAccount('Create a free account to follow people.')
      try { await api(`/users/${userId}/follow`, { method: isFollowing ? 'DELETE' : 'POST' }); setRows((rows) => rows.map((row) => row.author_id === userId ? { ...row, followed_by_me: !isFollowing } : row)) }
      catch (reason) { notify(errorText(reason, 'Could not update follow.')) }
    },
    async remove(story: StoryRow) {
      if (!window.confirm('Delete this post? This can’t be undone.')) return
      try { await api(`/stories/${story.id}`, { method: 'DELETE' }); setRows((rows) => rows.filter((row) => row.id !== story.id)); notify('Your post was deleted.') }
      catch (reason) { notify(errorText(reason, 'Could not delete the post.')) }
    },
    async togglePin(story: StoryRow) {
      const pin = !story.pinned
      try { await api('/profile/me/pin', { method: 'PUT', body: JSON.stringify({ storyId: pin ? story.id : null }) }); setRows((rows) => rows.map((row) => ({ ...row, pinned: pin && row.id === story.id && !row.reposted_by_handle }))); notify(pin ? 'Pinned to your profile.' : 'Unpinned.') }
      catch (reason) { notify(errorText(reason, 'Could not pin the post.')) }
    },
    hideAuthor(story: StoryRow) { setRows((rows) => rows.filter((row) => row.author_id !== story.author_id)); notify(`@${story.handle} is blocked.`) },
  }
}
export type StoryActions = ReturnType<typeof useStoryActions>

const reportReasons = ['Spam or fake account', 'Harassment or bullying', 'Inappropriate content', 'Unsafe behaviour', 'Under 18']

/** The ⋯ menu: your own post → pin / delete; someone else's → report / block (+ delete for admins). */
function PostMenu({ story, isAdmin, actions, onDone, onPinnable }: { story: StoryRow; isAdmin: boolean; actions: StoryActions; onDone: (message: string) => void; onPinnable: boolean }) {
  const [open, setOpen] = useState(false); const [reporting, setReporting] = useState(false); const [busy, setBusy] = useState(false)
  const close = () => { setOpen(false); setReporting(false) }
  async function report(reason: string) { setBusy(true); try { await api('/reports', { method: 'POST', body: JSON.stringify({ targetUserId: story.author_id, targetStoryId: story.id, reason }) }); onDone('Thanks — your report was sent to the Beer BROS team.') } catch (error) { onDone(errorText(error, 'Could not send report.')) } finally { setBusy(false); close() } }
  async function block() { if (!window.confirm(`Block @${story.handle}? You won’t see each other’s posts, and you can’t message each other.`)) return; setBusy(true); try { await api(`/users/${story.author_id}/block`, { method: 'POST' }); actions.hideAuthor(story) } catch (error) { onDone(errorText(error, 'Could not block this account.')) } finally { setBusy(false); close() } }
  return <div className="x-menu-wrap">
    <button className="x-more" onClick={() => { setOpen(!open); setReporting(false) }} aria-label="More options" aria-expanded={open}><MoreHorizontal size={18} /></button>
    {open && <><div className="x-menu-backdrop" onClick={close} /><div className="x-menu" role="menu">
      {story.own_story ? <>
        {onPinnable && <button role="menuitem" onClick={() => { close(); void actions.togglePin(story) }}>{story.pinned ? <><PinOff size={16} /> Unpin from profile</> : <><Pin size={16} /> Pin to your profile</>}</button>}
        <button role="menuitem" className="x-menu-danger" onClick={() => { close(); void actions.remove(story) }}><Trash2 size={16} /> Delete post</button>
      </> : reporting ? <>{reportReasons.map((reason) => <button key={reason} role="menuitem" disabled={busy} onClick={() => void report(reason)}>{reason}</button>)}<button role="menuitem" onClick={() => setReporting(false)} className="x-menu-muted">Back</button></>
        : <>
          <button role="menuitem" onClick={() => setReporting(true)}><Flag size={16} /> Report post</button>
          <button role="menuitem" className="x-menu-danger" disabled={busy} onClick={() => void block()}><Ban size={16} /> Block @{story.handle}</button>
          {isAdmin && <button role="menuitem" className="x-menu-danger" onClick={() => { close(); void actions.remove(story) }}><Trash2 size={16} /> Delete post (admin)</button>}
        </>}
    </div></>}
  </div>
}

export function FollowButton({ following, onClick }: { following: boolean; onClick: () => void }) {
  return <button className={`x-follow ${following ? 'following' : ''}`} onClick={onClick}>{following ? <><Check size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}</button>
}

export function Post({ story, guest, isAdmin = false, actions, onRequireAccount, onOpenProfile, onNotice, pinnable = false }: {
  story: StoryRow; guest: boolean; isAdmin?: boolean; actions: StoryActions; onRequireAccount: (reason: string) => void
  onOpenProfile: (handle: string) => void; onNotice: (text: string) => void; pinnable?: boolean
}) {
  const [expanded, setExpanded] = useState(false); const [comments, setComments] = useState<Comment[]>([]); const [text, setText] = useState(''); const [message, setMessage] = useState(''); const [replyCount, setReplyCount] = useState(story.reply_count)
  const [imageOpen, setImageOpen] = useState(false)
  async function loadReplies() { try { const result = await api<{comments: Comment[]}>(`/stories/${story.id}/comments`); setComments(result.comments) } catch (reason) { setMessage(errorText(reason, 'Could not load replies.')) } }
  async function toggleReplies() { const next = !expanded; setExpanded(next); if (next) await loadReplies() }
  async function reply(event: FormEvent) { event.preventDefault(); const body = text.trim(); if (!body) return; try { await api(`/stories/${story.id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }); setReplyCount((n) => n + 1); setText(''); setMessage(''); await loadReplies() } catch (reason) { setMessage(errorText(reason, 'Could not post reply.')) } }
  async function removeReply(comment: Comment) { if (!window.confirm('Delete your reply?')) return; try { await api(`/stories/${story.id}/comments/${comment.id}`, { method: 'DELETE' }); setComments((items) => items.filter((item) => item.id !== comment.id)); setReplyCount((n) => Math.max(0, n - 1)) } catch (reason) { setMessage(errorText(reason, 'Could not delete the reply.')) } }
  async function share() { const url = location.origin; try { if (navigator.share) await navigator.share({ title: `${story.display_name} on Beer BROS`, text: story.body, url }); else { await navigator.clipboard.writeText(url); setMessage('Link copied.') } } catch { /* share sheet dismissed */ } }
  const imageSrc = `${apiBase}/api/stories/${story.id}/image`
  const open = () => onOpenProfile(story.handle)
  return <article className="x-post-wrap">
    {(story.pinned || story.reposted_by_handle) && <div className="x-post-context">
      {story.pinned ? <><Pin size={14} /> Pinned</> : <><Repeat2 size={15} /> <button onClick={() => onOpenProfile(story.reposted_by_handle!)}>{story.reposted_by_name} reposted</button></>}
    </div>}
    <div className="x-post">
      <button className="x-avatar-button" onClick={open} aria-label={`Open ${story.display_name}’s profile`}><Avatar name={story.display_name} url={story.avatar_url} /></button>
      <div className="x-post-body">
        <div className="x-post-head"><button className="x-name-button" onClick={open}><strong>{story.display_name}</strong></button><span className="x-muted">@{story.handle}</span>{story.broad_area && <span className="x-muted">· {story.broad_area}</span>}<span className="x-muted">· {timeAgo(story.created_at)}</span>{!story.own_story && !story.followed_by_me && <button className="x-follow-inline" onClick={() => void actions.follow(story.author_id, false)}>Follow</button>}{!guest && <PostMenu story={story} isAdmin={isAdmin} actions={actions} onDone={onNotice} onPinnable={pinnable} />}</div>
        <p className="x-post-text">{story.body}</p>
        {story.topic_tags?.length > 0 && <div className="x-tags">{story.topic_tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
        {story.has_image && <button className="x-post-media" onClick={() => setImageOpen(true)} aria-label="Open photo"><img src={imageSrc} alt={`Photo posted by ${story.display_name}`} loading="lazy" /></button>}
        <div className="x-actions">
          <button className="x-action reply" onClick={() => void toggleReplies()} aria-label="Replies"><span className="x-action-icon"><MessageCircle size={18} /></span>{replyCount > 0 && replyCount}</button>
          <button className={`x-action repost ${story.reposted_by_me ? 'on' : ''}`} onClick={() => void actions.toggleRepost(story)} aria-label={story.reposted_by_me ? 'Undo repost' : 'Repost'}><span className="x-action-icon"><Repeat2 size={19} /></span>{(story.repost_count ?? 0) > 0 && story.repost_count}</button>
          <button className={`x-action like ${story.liked_by_me ? 'on' : ''}`} onClick={() => void actions.toggleLike(story)} aria-label={story.liked_by_me ? 'Unlike' : 'Like'}><span className="x-action-icon"><Heart size={18} fill={story.liked_by_me ? 'currentColor' : 'none'} /></span>{story.like_count > 0 && story.like_count}</button>
          <button className="x-action share" onClick={() => void share()} aria-label="Share"><span className="x-action-icon"><Share size={18} /></span></button>
        </div>
        {expanded && <div className="x-replies">
          {comments.map((comment) => <div className="x-reply" key={comment.id}>
            <div className="x-reply-head"><button className="x-name-button" onClick={() => onOpenProfile(comment.handle)}><strong>{comment.display_name}</strong></button> <span className="x-muted">@{comment.handle} · {timeAgo(comment.created_at)}</span>{(comment.own_comment || isAdmin) && <button className="x-reply-delete" onClick={() => void removeReply(comment)} aria-label="Delete reply"><Trash2 size={14} /></button>}</div>
            <p>{comment.body}</p>
          </div>)}
          {guest ? <button className="x-ghost x-reply-join" onClick={() => onRequireAccount('Create a free account to reply.')}>Log in or sign up to reply</button> : <form className="x-reply-form" onSubmit={(event) => void reply(event)}><input value={text} onChange={(event) => setText(event.target.value)} aria-label="Write a reply" placeholder="Post your reply" maxLength={500} /><button disabled={!text.trim()}>Reply</button></form>}
        </div>}
        {message && <small className="x-inline-status" role="status">{message}</small>}
      </div>
    </div>
    {imageOpen && <div className="x-lightbox" role="dialog" aria-label="Photo" onClick={() => setImageOpen(false)}><button aria-label="Close photo"><X size={22} /></button><img src={imageSrc} alt={`Photo posted by ${story.display_name}`} /></div>}
  </article>
}
