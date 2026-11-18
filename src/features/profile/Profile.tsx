import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, Camera, LogOut, MapPin, MessageCircle, Trash2, X } from 'lucide-react'
import { api, CurrentUser } from '../../lib/api/client'
import { compressAvatar } from '../../lib/image'
import Avatar from '../../components/Avatar'
import { errorText, FollowButton, Post, rowKey, StoryRow, timeAgo, useStoryActions } from '../feed/posts'

type ProfileData = { id: string; handle: string; display_name: string; bio: string; avatar_url: string | null; broad_area: string | null; joined_at: string; followers: number; following: number; post_count: number; followed_by_me: boolean; is_me: boolean }
type ReplyRow = { id: string; body: string; created_at: string; story_id: string; own_comment: boolean; story_body: string; story_handle: string; story_display_name: string }
type Props = { handle: string; currentUser: CurrentUser | null; onBack: () => void; onOpenProfile: (handle: string) => void; onRequireAccount: (reason: string) => void; onUserUpdated: (changes: Partial<CurrentUser>) => void; onLogout: () => void }

export default function Profile({ handle, currentUser, onBack, onOpenProfile, onRequireAccount, onUserUpdated, onLogout }: Props) {
  const guest = !currentUser
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [tab, setTab] = useState<'posts' | 'replies'>('posts')
  const [rows, setRows] = useState<StoryRow[]>([]); const [replies, setReplies] = useState<ReplyRow[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [editing, setEditing] = useState(false)
  const actions = useStoryActions({ setRows, guest, onRequireAccount, notify: setNotice })

  useEffect(() => {
    let alive = true
    setLoading(true); setError(''); setProfile(null); setRows([]); setReplies([]); setTab('posts')
    Promise.all([api<{profile: ProfileData}>(`/profiles/${encodeURIComponent(handle)}`), api<{stories: StoryRow[]}>(`/profiles/${encodeURIComponent(handle)}/stories`)])
      .then(([p, s]) => { if (alive) { setProfile(p.profile); setRows(s.stories) } })
      .catch((reason) => { if (alive) setError(errorText(reason, 'Could not load this profile.')) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [handle])
  useEffect(() => { if (tab !== 'replies' || !profile) return; api<{replies: ReplyRow[]}>(`/profiles/${encodeURIComponent(profile.handle)}/replies`).then((r) => setReplies(r.replies)).catch((reason) => setNotice(errorText(reason, 'Could not load replies.'))) }, [tab, profile])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4000); return () => window.clearTimeout(timer) }, [notice])

  async function toggleFollow() {
    if (!profile) return
    if (guest) return onRequireAccount('Create a free account to follow people.')
    const following = profile.followed_by_me
    setProfile({ ...profile, followed_by_me: !following, followers: profile.followers + (following ? -1 : 1) })
    try { await api(`/users/${profile.id}/follow`, { method: following ? 'DELETE' : 'POST' }) } catch (reason) { setProfile(profile); setNotice(errorText(reason, 'Could not update follow.')) }
  }
  async function deleteReply(reply: ReplyRow) {
    if (!window.confirm('Delete your reply?')) return
    try { await api(`/stories/${reply.story_id}/comments/${reply.id}`, { method: 'DELETE' }); setReplies((items) => items.filter((item) => item.id !== reply.id)) } catch (reason) { setNotice(errorText(reason, 'Could not delete the reply.')) }
  }

  const joined = profile ? new Date(profile.joined_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : ''
  return <div className="x-feed x-profile">
    <div className="x-page-header x-profile-header">
      <button className="x-icon-button x-back" onClick={onBack} aria-label="Back"><ArrowLeft size={20} /></button>
      <div><h1>{profile?.display_name ?? 'Profile'}</h1>{profile && <span className="x-muted">{profile.post_count} {profile.post_count === 1 ? 'post' : 'posts'}</span>}</div>
    </div>
    {loading && <div className="x-loading"><span className="x-spinner" /></div>}
    {error && <div className="x-empty"><h2>{error}</h2><p>Try searching for another account.</p></div>}
    {profile && <>
      <div className="x-profile-banner" />
      <div className="x-profile-top">
        <div className="x-profile-photo"><Avatar name={profile.display_name} url={profile.avatar_url} size={112} /></div>
        <div className="x-profile-buttons">
          {profile.is_me ? <>
            <button className="x-ghost" onClick={() => setEditing(true)}>Edit profile</button>
            <button className="x-ghost x-icon-ghost" onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
          </> : <FollowButton following={profile.followed_by_me} onClick={() => void toggleFollow()} />}
        </div>
      </div>
      <div className="x-profile-info">
        <h2>{profile.display_name}</h2>
        <span className="x-muted">@{profile.handle}</span>
        {profile.bio ? <p className="x-profile-bio">{profile.bio}</p> : profile.is_me && <p className="x-profile-bio x-muted">Add a short bio so people know who they’re drinking with. Tap Edit profile.</p>}
        <div className="x-profile-meta">
          {profile.broad_area && <span><MapPin size={15} /> {profile.broad_area}</span>}
          <span><CalendarDays size={15} /> Joined {joined}</span>
        </div>
        <div className="x-profile-counts"><span><strong>{profile.following}</strong> Following</span><span><strong>{profile.followers}</strong> {profile.followers === 1 ? 'Follower' : 'Followers'}</span></div>
      </div>
      <div className="x-tabs x-profile-tabs" role="tablist">
        {(['posts', 'replies'] as const).map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}><span>{item === 'posts' ? 'Posts' : 'Replies'}</span></button>)}
      </div>
      {tab === 'posts' && <>
        {rows.map((story) => <Post key={rowKey(story)} story={story} guest={guest} isAdmin={Boolean(currentUser?.isAdmin)} actions={actions} onRequireAccount={onRequireAccount} onOpenProfile={onOpenProfile} onNotice={setNotice} pinnable={profile.is_me} />)}
        {rows.length === 0 && <div className="x-empty"><h2>{profile.is_me ? 'You haven’t posted yet' : `@${profile.handle} hasn’t posted yet`}</h2><p>{profile.is_me ? 'When you post or repost, it shows up here.' : 'When they post, it’ll show up here.'}</p></div>}
      </>}
      {tab === 'replies' && <>
        {replies.map((reply) => <article className="x-post x-reply-row" key={reply.id}>
          <Avatar name={profile.display_name} url={profile.avatar_url} />
          <div className="x-post-body">
            <div className="x-post-head"><strong>{profile.display_name}</strong><span className="x-muted">@{profile.handle} · {timeAgo(reply.created_at)}</span>{(reply.own_comment || currentUser?.isAdmin) && <button className="x-reply-delete" onClick={() => void deleteReply(reply)} aria-label="Delete reply"><Trash2 size={15} /></button>}</div>
            <div className="x-muted x-replying-to">Replying to <button className="x-link" onClick={() => onOpenProfile(reply.story_handle)}>@{reply.story_handle}</button></div>
            <p className="x-post-text">{reply.body}</p>
            <div className="x-quoted"><MessageCircle size={14} /> <strong>{reply.story_display_name}</strong> <span className="x-muted">{reply.story_body.length > 120 ? `${reply.story_body.slice(0, 120)}…` : reply.story_body}</span></div>
          </div>
        </article>)}
        {replies.length === 0 && <div className="x-empty"><h2>No replies yet</h2><p>{profile.is_me ? 'Your replies to other people’s posts show up here.' : 'Their replies to posts show up here.'}</p></div>}
      </>}
    </>}
    {editing && profile && <EditProfile profile={profile} onClose={() => setEditing(false)} onSaved={(updated) => { setProfile({ ...profile, ...updated }); setRows((items) => items.map((row) => row.author_id === profile.id ? { ...row, display_name: updated.display_name, avatar_url: updated.avatar_url, broad_area: updated.broad_area } : row)); onUserUpdated({ displayName: updated.display_name, avatarUrl: updated.avatar_url }); setEditing(false); setNotice('Profile saved.') }} />}
    {notice && <div className="x-toast" role="status">{notice}</div>}
  </div>
}

function EditProfile({ profile, onClose, onSaved }: { profile: ProfileData; onClose: () => void; onSaved: (profile: ProfileData) => void }) {
  const [name, setName] = useState(profile.display_name); const [bio, setBio] = useState(profile.bio); const [area, setArea] = useState(profile.broad_area ?? '')
  const [photo, setPhoto] = useState<string | null | undefined>(undefined) // undefined = unchanged, null = removed
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  async function pick(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setError(''); try { setPhoto(await compressAvatar(file)) } catch (reason) { setError(errorText(reason, 'Could not use that photo.')) } }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!name.trim()) return setError('Your name can’t be empty.')
    setBusy(true); setError('')
    try { const result = await api<{profile: ProfileData}>('/profile/me', { method: 'PATCH', body: JSON.stringify({ displayName: name.trim(), bio: bio.trim(), broadArea: area.trim(), ...(photo !== undefined ? { avatar: photo } : {}) }) }); onSaved(result.profile) }
    catch (reason) { setError(errorText(reason, 'Could not save your profile.')) }
    finally { setBusy(false) }
  }
  const preview = photo === undefined ? profile.avatar_url : photo
  return <div className="x-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-title" onClick={onClose}>
    <form className="x-modal x-edit-profile" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void save(event)}>
      <div className="x-edit-top"><button type="button" className="x-icon-button x-back" onClick={onClose} aria-label="Close"><X size={20} /></button><h2 id="edit-title">Edit profile</h2><button className="x-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      <div className="x-edit-photo">
        <button type="button" className="x-edit-photo-button" onClick={() => fileInput.current?.click()} aria-label="Change profile photo"><Avatar name={name || profile.display_name} url={preview} size={96} /><span className="x-edit-photo-overlay"><Camera size={22} /></span></button>
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => void pick(event)} />
        <div><button type="button" className="x-link" onClick={() => fileInput.current?.click()}>Change photo</button>{preview && <button type="button" className="x-link x-link-muted" onClick={() => setPhoto(null)}>Remove</button>}</div>
      </div>
      <label className="x-field"><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required /></label>
      <label className="x-field"><span>Bio <em>{bio.length}/300</em></span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} rows={3} placeholder="Favourite beer, where you like to hang out…" /></label>
      <label className="x-field"><span>Area</span><input value={area} onChange={(event) => setArea(event.target.value)} maxLength={60} placeholder="e.g. Ntinda, Kololo" /></label>
      {error && <p className="x-auth-error" role="alert">{error}</p>}
    </form>
  </div>
}
