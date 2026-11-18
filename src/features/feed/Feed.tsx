import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Ban, Check, Flag, Heart, ImagePlus, MessageCircle, MoreHorizontal, Search, Send, Share, ShieldCheck, UserPlus, X } from 'lucide-react'
import { api, CurrentUser } from '../../lib/api/client'
import { compressPhoto } from '../../lib/image'
import Avatar from '../../components/Avatar'

type StoryRow = { id: string; body: string; topic_tags: string[]; created_at: string; has_image?: boolean; handle: string; display_name: string; avatar_url?: string | null; broad_area?: string | null; like_count: number; reply_count: number; liked_by_me: boolean; author_id: string; followed_by_me: boolean; own_story?: boolean }
type Person = { id: string; handle: string; display_name: string; bio: string; avatar_url?: string | null; broad_area?: string | null; followed_by_me: boolean }
type Comment = { id: string; body: string; handle: string; display_name: string; created_at: string }
type Thread = { id: string; other_user_id: string; handle: string; display_name: string; avatar_url?: string | null; last_message?: string | null }
type Message = { id: string; sender_id: string; body: string; created_at: string }
type FeedProps = { mode: 'Home' | 'Search' | 'Messages'; query: string; onQueryChange: (value: string) => void; currentUser: CurrentUser | null; composeSignal: number; announcements?: ReactNode; onRequireAccount: (reason: string) => void; onJoin: () => void }
const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const timeAgo = (value: string) => { const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); return mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : mins < 10080 ? `${Math.floor(mins / 1440)}d` : new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
const errorText = (reason: unknown, fallback: string) => reason instanceof Error ? reason.message : fallback

export default function Feed({ mode, query, onQueryChange, currentUser, composeSignal, announcements, onRequireAccount, onJoin }: FeedProps) {
  const guest = !currentUser
  const [rows, setRows] = useState<StoryRow[]>([]); const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [refresh, setRefresh] = useState(0)
  const [filter, setFilter] = useState<'for-you' | 'following'>('for-you')
  const load = useCallback(async () => { setLoading(true); setError(''); try {
    if (mode === 'Messages') return
    if (mode === 'Search') { if (!query.trim()) { setRows([]); setPeople([]) } else { const result = await api<{stories: StoryRow[]; people: Person[]}>(`/search?q=${encodeURIComponent(query.trim())}`); setRows(result.stories); setPeople(result.people) } }
    else { const result = await api<{stories: StoryRow[]}>(`/stories${filter === 'following' ? '?feed=following' : ''}`); setRows(result.stories) }
  } catch (reason) { setError(errorText(reason, 'Could not load posts.')) } finally { setLoading(false) } }, [filter, mode, query, refresh])
  useEffect(() => { const timer = window.setTimeout(() => void load(), mode === 'Search' ? 300 : 0); return () => window.clearTimeout(timer) }, [load, mode])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4000); return () => window.clearTimeout(timer) }, [notice])
  if (mode === 'Messages' && currentUser) return <Messages currentUserId={currentUser.id} />

  const publish = async (text: string, image?: string) => { await api('/stories', { method: 'POST', body: JSON.stringify({ body: text, image }) }); setNotice('Your post was sent.'); setFilter('for-you'); setRefresh((n) => n + 1) }
  const follow = async (userId: string, isFollowing: boolean) => { if (guest) return onRequireAccount('Create a free account to follow people.'); try { await api(`/users/${userId}/follow`, { method: isFollowing ? 'DELETE' : 'POST' }); setPeople((items) => items.map((person) => person.id === userId ? { ...person, followed_by_me: !isFollowing } : person)); setRows((items) => items.map((story) => story.author_id === userId ? { ...story, followed_by_me: !isFollowing } : story)) } catch (reason) { setNotice(errorText(reason, 'Could not update follow.')) } }
  const toggleLike = async (story: StoryRow) => { if (guest) return onRequireAccount('Create a free account to like posts.'); const liked = !story.liked_by_me; setRows((items) => items.map((item) => item.id === story.id ? { ...item, liked_by_me: liked, like_count: item.like_count + (liked ? 1 : -1) } : item)); try { await api(`/stories/${story.id}/likes`, { method: liked ? 'POST' : 'DELETE' }) } catch (reason) { setRows((items) => items.map((item) => item.id === story.id ? story : item)); setNotice(errorText(reason, 'Could not update like.')) } }

  return <div className="x-feed">
    {mode === 'Search'
      ? <div className="x-page-header x-search-header"><label className="x-search"><Search size={17} /><input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search people and posts" aria-label="Search people and posts" />{query && <button type="button" aria-label="Clear search" onClick={() => onQueryChange('')}><X size={14} /></button>}</label></div>
      : <div className="x-page-header x-tabs-header"><h1 className="x-mobile-hidden">Home</h1><div className="x-tabs" role="tablist">{(['for-you', 'following'] as const).map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'selected' : ''} onClick={() => { if (guest && item === 'following') return onRequireAccount('Create a free account to follow people and see their posts here.'); setFilter(item) }}><span>{item === 'for-you' ? 'For you' : 'Following'}</span></button>)}</div></div>}
    {mode === 'Home' && announcements}
    {mode === 'Home' && (currentUser ? <Composer user={currentUser} onPublish={publish} focusSignal={composeSignal} /> : <div className="x-guest-intro"><h2>See what’s happening tonight</h2><p>Where people are drinking, which bars have the vibe, and who’s looking for company. Free to join — no fees, no card.</p><button className="x-primary" onClick={onJoin}>Create free account</button></div>)}
    {mode === 'Search' && people.length > 0 && <section className="x-people"><h2>People</h2>{people.map((person) => <div className="x-person" key={person.id}><Avatar name={person.display_name} url={person.avatar_url} /><div className="x-person-text"><strong>{person.display_name}</strong><span>@{person.handle}{person.broad_area ? ` · ${person.broad_area}` : ''}</span>{person.bio && <p>{person.bio}</p>}</div><FollowButton following={person.followed_by_me} onClick={() => void follow(person.id, person.followed_by_me)} /></div>)}</section>}
    {mode === 'Search' && rows.length > 0 && <h2 className="x-section-title">Posts</h2>}
    {error && <div role="alert" className="x-error"><p>{error}</p><button onClick={() => setRefresh((n) => n + 1)}>Retry</button></div>}
    {loading && rows.length === 0 && <div className="x-loading"><span className="x-spinner" /></div>}
    {!error && rows.map((story) => <Post key={story.id} story={story} guest={guest} onRequireAccount={onRequireAccount} onLike={() => void toggleLike(story)} onFollow={follow} onNotice={setNotice} onBlocked={() => { setRows((items) => items.filter((item) => item.author_id !== story.author_id)); setPeople((items) => items.filter((person) => person.id !== story.author_id)); setNotice(`@${story.handle} is blocked.`) }} />)}
    {!loading && !error && rows.length === 0 && !(mode === 'Search' && people.length > 0) && <div className="x-empty">
      <h2>{mode === 'Search' ? (query ? `No results for “${query}”` : 'Search Beer BROS') : filter === 'following' ? 'Nobody to show yet' : 'No posts yet'}</h2>
      <p>{mode === 'Search' ? (query ? 'Try a different name, bar or word.' : 'Find people, bars and posts from the community.') : filter === 'following' ? 'Follow people and their posts will show up here.' : 'Be the first — share where you’re drinking tonight.'}</p>
    </div>}
    {notice && <div className="x-toast" role="status">{notice}</div>}
  </div>
}

const reportReasons = ['Spam or fake account', 'Harassment or bullying', 'Inappropriate content', 'Unsafe behaviour', 'Under 18']
function SafetyMenu({ userId, handle, storyId, onBlocked, onDone }: { userId: string; handle: string; storyId?: string; onBlocked: () => void; onDone: (message: string) => void }) {
  const [open, setOpen] = useState(false); const [reporting, setReporting] = useState(false); const [busy, setBusy] = useState(false)
  async function report(reason: string) { setBusy(true); try { await api('/reports', { method: 'POST', body: JSON.stringify({ targetUserId: userId, targetStoryId: storyId, reason }) }); onDone('Thanks — your report was sent to the Beer BROS team.') } catch (reason) { onDone(errorText(reason, 'Could not send report.')) } finally { setBusy(false); setOpen(false); setReporting(false) } }
  async function block() { if (!window.confirm(`Block @${handle}? You won’t see each other’s posts, and you can’t message each other.`)) return; setBusy(true); try { await api(`/users/${userId}/block`, { method: 'POST' }); onBlocked() } catch (reason) { onDone(errorText(reason, 'Could not block this account.')) } finally { setBusy(false); setOpen(false) } }
  return <div className="x-menu-wrap">
    <button className="x-more" onClick={() => { setOpen(!open); setReporting(false) }} aria-label="More options" aria-expanded={open}><MoreHorizontal size={18} /></button>
    {open && <><div className="x-menu-backdrop" onClick={() => setOpen(false)} /><div className="x-menu" role="menu">
      {reporting ? <>{reportReasons.map((reason) => <button key={reason} role="menuitem" disabled={busy} onClick={() => void report(reason)}>{reason}</button>)}<button role="menuitem" onClick={() => setReporting(false)} className="x-menu-muted">Back</button></>
        : <><button role="menuitem" onClick={() => setReporting(true)}><Flag size={16} /> Report {storyId ? 'post' : `@${handle}`}</button><button role="menuitem" className="x-menu-danger" disabled={busy} onClick={() => void block()}><Ban size={16} /> Block @{handle}</button></>}
    </div></>}
  </div>
}

function FollowButton({ following, onClick }: { following: boolean; onClick: () => void }) {
  return <button className={`x-follow ${following ? 'following' : ''}`} onClick={onClick}>{following ? <><Check size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}</button>
}

function Post({ story, guest, onRequireAccount, onLike, onFollow, onNotice, onBlocked }: { story: StoryRow; guest: boolean; onRequireAccount: (reason: string) => void; onLike: () => void; onFollow: (id: string, following: boolean) => void; onNotice: (text: string) => void; onBlocked: () => void }) {
  const [expanded, setExpanded] = useState(false); const [comments, setComments] = useState<Comment[]>([]); const [text, setText] = useState(''); const [message, setMessage] = useState(''); const [replyCount, setReplyCount] = useState(story.reply_count)
  const [imageOpen, setImageOpen] = useState(false)
  async function toggleReplies() { const next = !expanded; setExpanded(next); if (next) try { const result = await api<{comments: Comment[]}>(`/stories/${story.id}/comments`); setComments(result.comments) } catch (reason) { setMessage(errorText(reason, 'Could not load replies.')) } }
  async function reply(event: FormEvent) { event.preventDefault(); const body = text.trim(); if (!body) return; try { await api(`/stories/${story.id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }); setComments((items) => [...items, { id: crypto.randomUUID(), body, handle: 'you', display_name: 'You', created_at: new Date().toISOString() }]); setReplyCount((n) => n + 1); setText(''); setMessage('') } catch (reason) { setMessage(errorText(reason, 'Could not post reply.')) } }
  async function share() { const url = location.origin; try { if (navigator.share) await navigator.share({ title: `${story.display_name} on Beer BROS`, text: story.body, url }); else { await navigator.clipboard.writeText(url); setMessage('Link copied.') } } catch { /* share sheet dismissed */ } }
  const imageSrc = `${apiBase}/api/stories/${story.id}/image`
  return <article className="x-post">
    <Avatar name={story.display_name} url={story.avatar_url} />
    <div className="x-post-body">
      <div className="x-post-head"><strong>{story.display_name}</strong><span className="x-muted">@{story.handle}</span>{story.broad_area && <span className="x-muted">· {story.broad_area}</span>}<span className="x-muted">· {timeAgo(story.created_at)}</span>{!story.own_story && !story.followed_by_me && <button className="x-follow-inline" onClick={() => onFollow(story.author_id, false)}>Follow</button>}{!story.own_story && !guest && <SafetyMenu userId={story.author_id} handle={story.handle} storyId={story.id} onBlocked={onBlocked} onDone={onNotice} />}</div>
      <p className="x-post-text">{story.body}</p>
      {story.topic_tags?.length > 0 && <div className="x-tags">{story.topic_tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
      {story.has_image && <button className="x-post-media" onClick={() => setImageOpen(true)} aria-label="Open photo"><img src={imageSrc} alt={`Photo posted by ${story.display_name}`} loading="lazy" /></button>}
      <div className="x-actions">
        <button className="x-action reply" onClick={() => void toggleReplies()} aria-label="Replies"><span className="x-action-icon"><MessageCircle size={18} /></span>{replyCount > 0 && replyCount}</button>
        <button className={`x-action like ${story.liked_by_me ? 'on' : ''}`} onClick={onLike} aria-label={story.liked_by_me ? 'Unlike' : 'Like'}><span className="x-action-icon"><Heart size={18} fill={story.liked_by_me ? 'currentColor' : 'none'} /></span>{story.like_count > 0 && story.like_count}</button>
        <button className="x-action share" onClick={() => void share()} aria-label="Share"><span className="x-action-icon"><Share size={18} /></span></button>
      </div>
      {expanded && <div className="x-replies">
        {comments.map((comment) => <div className="x-reply" key={comment.id}><strong>{comment.display_name}</strong> <span className="x-muted">@{comment.handle}</span><p>{comment.body}</p></div>)}
        {guest ? <button className="x-ghost x-reply-join" onClick={() => onRequireAccount('Create a free account to reply.')}>Log in or sign up to reply</button> : <form className="x-reply-form" onSubmit={(event) => void reply(event)}><input value={text} onChange={(event) => setText(event.target.value)} aria-label="Write a reply" placeholder="Post your reply" maxLength={500} /><button disabled={!text.trim()}>Reply</button></form>}
      </div>}
      {message && <small className="x-inline-status" role="status">{message}</small>}
    </div>
    {imageOpen && <div className="x-lightbox" role="dialog" aria-label="Photo" onClick={() => setImageOpen(false)}><button aria-label="Close photo"><X size={22} /></button><img src={imageSrc} alt={`Photo posted by ${story.display_name}`} /></div>}
  </article>
}

function Composer({ user, onPublish, focusSignal }: { user: CurrentUser; onPublish: (text: string, image?: string) => Promise<void>; focusSignal: number }) {
  const [text, setText] = useState(''); const [image, setImage] = useState<string>(); const [busy, setBusy] = useState(false); const [preparing, setPreparing] = useState(false); const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null); const textArea = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (focusSignal) { textArea.current?.focus(); textArea.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }) } }, [focusSignal])
  useEffect(() => { const el = textArea.current; if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` } }, [text])
  async function pick(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setError(''); setPreparing(true); try { setImage(await compressPhoto(file)) } catch (reason) { setError(errorText(reason, 'Could not use that photo.')) } finally { setPreparing(false) } }
  async function submit(event: FormEvent) { event.preventDefault(); if (!text.trim() || busy) return; setBusy(true); setError(''); try { await onPublish(text.trim(), image); setText(''); setImage(undefined) } catch (reason) { setError(errorText(reason, 'Could not send your post.')) } finally { setBusy(false) } }
  const remaining = 500 - text.length
  return <form className="x-composer" onSubmit={(event) => void submit(event)}>
    <Avatar name={user.displayName} />
    <div className="x-composer-main">
      <textarea ref={textArea} rows={2} value={text} onChange={(event) => setText(event.target.value)} placeholder="Where are you drinking? Any vibe tonight?" aria-label="Write a post" maxLength={500} />
      {preparing && <div className="x-composer-preparing">Preparing photo…</div>}
      {image && <div className="x-composer-media"><img src={image} alt="Selected photo preview" /><button type="button" onClick={() => setImage(undefined)} aria-label="Remove photo"><X size={16} /></button></div>}
      {image && !text.trim() && <p className="x-composer-hint">Add a caption to post your photo.</p>}
      {error && <p className="x-composer-error" role="alert">{error}</p>}
      <div className="x-composer-bar">
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => void pick(event)} />
        <button type="button" className="x-icon-button" onClick={() => fileInput.current?.click()} aria-label="Add photo" title="Add photo" disabled={busy || preparing}><ImagePlus size={20} /></button>
        <span className="x-composer-safety"><ShieldCheck size={14} /> Be respectful</span>
        {text.length > 0 && <span className={`x-count ${remaining < 20 ? 'low' : ''}`}>{remaining}</span>}
        <button type="submit" className="x-primary" disabled={!text.trim() || busy || preparing}>{busy ? 'Posting…' : 'Post'}</button>
      </div>
    </div>
  </form>
}

export function FeedRail() {
  return <>
    <section className="x-card"><h2>Tonight on Beer BROS</h2><div className="x-card-row"><span className="x-muted">Drinking alone?</span><strong>Post a photo and say where you are</strong></div><div className="x-card-row"><span className="x-muted">Found a good spot?</span><strong>Tell people the vibe is there</strong></div><div className="x-card-row"><span className="x-muted">Want a buddy?</span><strong>Swipe in Discover</strong></div></section>
    <section className="x-card"><h2>Good company, good care</h2><p className="x-card-copy">Drink responsibly, meet in public places, and look out for your people. Report anyone who makes you uncomfortable.</p></section>
  </>
}

function Messages({ currentUserId }: { currentUserId: string }) {
  const [threads, setThreads] = useState<Thread[]>([]); const [selected, setSelected] = useState<Thread | null>(null); const [messages, setMessages] = useState<Message[]>([]); const [draft, setDraft] = useState(''); const [refresh, setRefresh] = useState(0); const [error, setError] = useState('')
  const history = useRef<HTMLDivElement>(null)
  useEffect(() => { let active = true; const load = () => api<{conversations: Thread[]}>('/conversations').then(({ conversations }) => { if (active) setThreads(conversations) }).catch((reason) => { if (active) setError(errorText(reason, 'Could not load inbox.')) }); void load(); const timer = window.setInterval(() => void load(), 8000); return () => { active = false; window.clearInterval(timer) } }, [refresh])
  useEffect(() => { if (!selected) return; let active = true; const load = () => api<{messages: Message[]}>(`/conversations/${selected.id}/messages`).then(({ messages }) => { if (active) setMessages(messages) }).catch((reason) => { if (active) setError(errorText(reason, 'Could not load messages.')) }); void load(); const timer = window.setInterval(() => void load(), 3000); return () => { active = false; window.clearInterval(timer) } }, [selected])
  useEffect(() => { history.current?.scrollTo({ top: history.current.scrollHeight }) }, [messages.length])
  async function send(event: FormEvent) { event.preventDefault(); if (!selected || !draft.trim()) return; try { const { message } = await api<{message: Message}>(`/conversations/${selected.id}/messages`, { method: 'POST', body: JSON.stringify({ body: draft.trim() }) }); setMessages((items) => [...items, message]); setDraft(''); setRefresh((n) => n + 1) } catch (reason) { setError(errorText(reason, 'Could not send message.')) } }
  if (selected) return <div className="x-chat">
    <div className="x-page-header x-chat-header"><button className="x-icon-button" onClick={() => { setSelected(null); setMessages([]) }} aria-label="Back to messages"><ArrowLeft size={20} /></button><Avatar name={selected.display_name} url={selected.avatar_url} size={32} /><div className="x-chat-names"><h1>{selected.display_name}</h1><span className="x-muted">@{selected.handle}</span></div><SafetyMenu userId={selected.other_user_id} handle={selected.handle} onBlocked={() => { setThreads((items) => items.filter((item) => item.id !== selected.id)); setSelected(null); setMessages([]) }} onDone={setError} /></div>
    {error && <p role="alert" className="x-composer-error x-pad">{error}</p>}
    <div className="x-chat-history" ref={history}>{messages.length === 0 && <p className="x-muted x-pad">Say hi and agree where to meet — somewhere public.</p>}{messages.map((message) => <div className={`x-bubble ${message.sender_id === currentUserId ? 'mine' : 'theirs'}`} key={message.id}><p>{message.body}</p><small>{timeAgo(message.created_at)}</small></div>)}</div>
    <form className="x-chat-form" onSubmit={(event) => void send(event)}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Start a new message" aria-label="Write a message" maxLength={2000} /><button aria-label="Send message" disabled={!draft.trim()}><Send size={18} /></button></form>
  </div>
  return <div className="x-feed">
    <div className="x-page-header"><h1>Messages</h1></div>
    {error && <p role="alert" className="x-composer-error x-pad">{error}</p>}
    {threads.map((thread) => <button className="x-thread" key={thread.id} onClick={() => { setError(''); setSelected(thread) }}><Avatar name={thread.display_name} url={thread.avatar_url} /><span className="x-thread-text"><span><strong>{thread.display_name}</strong> <span className="x-muted">@{thread.handle}</span></span><span className="x-muted">{thread.last_message || 'You matched — say hi'}</span></span></button>)}
    {threads.length === 0 && <div className="x-empty"><h2>Welcome to your inbox</h2><p>When you and someone both swipe right in Discover, you can message each other here and agree to meet up.</p></div>}
  </div>
}
