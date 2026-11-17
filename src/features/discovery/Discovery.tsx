import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Heart, MessageCircle, RotateCcw, ShieldCheck, X } from 'lucide-react'
import ProfileCard from '../../components/ProfileCard'
import type { Profile } from '../../types'
import { api } from '../../lib/api/client'

type Member = { id: string; handle: string; display_name: string; age: number; bio: string; avatar_url?: string | null; broad_area?: string | null; current_drink_id?: string | null; interests?: string[]; created_at?: string; conversation_id?: string }
type ActionResult = { action: 'pass' | 'interested'; matched: boolean; conversationId?: string }
type View = 'discover' | 'incoming' | 'matches'
const avatarFallback = (name: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a0c"/><stop offset="1" stop-color="#0d0d0d"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><text x="300" y="420" font-family="Arial,sans-serif" font-size="260" font-weight="700" fill="#f5b82e" text-anchor="middle">${(name.trim()[0] ?? '?').toUpperCase().replace(/[<>&"]/g, '')}</text></svg>`)}`
const toProfile = (member: Member): Profile => ({ id: member.id, name: member.display_name, age: member.age, area: member.broad_area || 'Area not shared', distance: '', bio: member.bio || 'Still writing a little introduction.', interests: member.interests || [], drinkId: member.current_drink_id || undefined, image: member.avatar_url || avatarFallback(member.display_name) })

export default function Discovery({ onOpenConversation }: { onOpenConversation: (userId: string) => Promise<void> }) {
  const [view, setView] = useState<View>('discover')
  const [enabled, setEnabled] = useState(false)
  const [candidates, setCandidates] = useState<Member[]>([])
  const [incoming, setIncoming] = useState<Member[]>([])
  const [matches, setMatches] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [matched, setMatched] = useState<Member | null>(null)
  const [dragX, setDragX] = useState(0)
  const dragStart = useRef<number | null>(null)
  const current = view === 'discover' ? candidates[0] : view === 'incoming' ? incoming[0] : undefined
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [settings, candidateResult, incomingResult, matchResult] = await Promise.all([
        api<{enabled: boolean}>('/profile/discovery'),
        api<{enabled: boolean; candidates: Member[]}>('/discovery/candidates'),
        api<{interests: Member[]}>('/discovery/incoming'),
        api<{matches: Member[]}>('/discovery/matches'),
      ])
      setEnabled(settings.enabled); setCandidates(candidateResult.candidates); setIncoming(incomingResult.interests); setMatches(matchResult.matches)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load Discovery.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (view !== 'incoming' && view !== 'matches') return
    const poll = async () => {
      try {
        if (view === 'incoming') { const result = await api<{interests: Member[]}>('/discovery/incoming'); setIncoming(result.interests) }
        else { const result = await api<{matches: Member[]}>('/discovery/matches'); setMatches(result.matches) }
      } catch { /* Keep the last successful list visible; the next refresh can retry. */ }
    }
    const timer = window.setInterval(() => void poll(), 5000)
    return () => window.clearInterval(timer)
  }, [view])

  const toggleEnabled = async () => {
    setBusy(true); setError('')
    try { const result = await api<{enabled: boolean}>('/profile/discovery', { method: 'PUT', body: JSON.stringify({ enabled: !enabled }) }); setEnabled(result.enabled); setNotice(result.enabled ? 'Your profile is now visible to opted-in members. Only your broad area is shared.' : 'Your profile is hidden from new Discovery searches.'); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update Discovery settings.') }
    finally { setBusy(false) }
  }

  const act = async (member: Member, action: 'pass' | 'interested') => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await api<ActionResult>('/discovery/actions', { method: 'POST', body: JSON.stringify({ targetUserId: member.id, action }) })
      if (view === 'discover') setCandidates((items) => items.filter((item) => item.id !== member.id))
      else setIncoming((items) => items.filter((item) => item.id !== member.id))
      if (result.matched) { setMatched(member); setNotice(`You and ${member.display_name} are both interested. A private chat is ready.`); await load() }
      else setNotice(action === 'interested' ? `Your interest was sent to ${member.display_name}. They can see it in “Likes you”.` : `You passed on ${member.display_name}.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save that Discovery action.') }
    finally { setBusy(false); setDragX(0) }
  }

  const startSwipe = (event: PointerEvent<HTMLDivElement>) => { if (event.button !== 0) return; dragStart.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId) }
  const moveSwipe = (event: PointerEvent<HTMLDivElement>) => { if (dragStart.current !== null) setDragX(event.clientX - dragStart.current) }
  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return
    const distance = event.clientX - dragStart.current; dragStart.current = null
    if (Math.abs(distance) >= 100 && current) void act(current, distance > 0 ? 'interested' : 'pass')
    else setDragX(0)
  }

  return <section className="discovery-layout" aria-labelledby="discover-title">
    <div className="discovery-main">
      <div className="section-head"><div><div className="eyebrow"><span className="eyebrow-line"/> PEOPLE OPEN TO MEETING</div><h1 id="discover-title">A good night starts<br className="desktop-break"/> with <em>good company.</em></h1><p className="section-subtitle">Meet opted-in adults nearby. Right swipe or tap Interested to let someone know you’d like to hang out.</p></div><div className="profile-count"><span className="count-mark"/>{loading ? 'Loading' : view === 'discover' ? `${candidates.length} people` : view === 'incoming' ? `${incoming.length} likes` : `${matches.length} matches`}</div></div>
      <nav className="discovery-tabs" aria-label="Discovery sections">{([{id:'discover',label:'Discover'},{id:'incoming',label:'Likes you'},{id:'matches',label:'Matches'}] as const).map((item)=><button key={item.id} className={view===item.id?'selected':''} onClick={()=>{setView(item.id);setMatched(null);void load()}}>{item.label}{item.id==='incoming'&&incoming.length>0&&<span>{incoming.length}</span>}</button>)}</nav>
      {error && <div role="alert" className="feed-error"><p>{error}</p><button onClick={()=>void load()}>Try again</button></div>}
      {!enabled && view==='discover' && <div className="empty-card"><span className="empty-icon"><ShieldCheck size={24}/></span><h2>Choose whether to be discoverable</h2><p>Your profile is hidden by default. Turn this on to see other opted-in adults and let them see yours. Discovery shows only your broad area, never exact coordinates.</p><button className="reset-button" disabled={busy} onClick={()=>void toggleEnabled()}>{busy?'Saving…':'Enable my Discovery profile'}</button></div>}
      {enabled && view==='discover' && (loading ? <div className="feed-loading">Finding opted-in members…</div> : current ? <>
        <div className="card-stage swipe-card" key={current.id} style={{transform:`translateX(${dragX}px) rotate(${dragX/18}deg)`,touchAction:'pan-y'}} onPointerDown={startSwipe} onPointerMove={moveSwipe} onPointerUp={finishSwipe} onPointerCancel={()=>{dragStart.current=null;setDragX(0)}}><ProfileCard profile={toProfile(current)}/>{Math.abs(dragX)>24&&<span className={`swipe-indicator ${dragX>0?'positive':'negative'}`}>{dragX>0?'INTERESTED':'PASS'}</span>}</div>
        <div className="action-row" aria-label="Profile actions"><button className="action-button pass-button" disabled={busy} onClick={()=>void act(current,'pass')} aria-label="Pass on profile"><X size={23}/><span>Pass</span></button><button className="action-button like-button" disabled={busy} onClick={()=>void act(current,'interested')} aria-label="Express interest"><Heart size={22} fill="currentColor"/><span>Interested</span></button></div><p className="swipe-hint">Swipe left to pass · swipe right or tap Interested to let them know</p>
      </> : <div className="empty-card"><span className="empty-icon"><Heart size={24}/></span><h2>You’re all caught up</h2><p>New opted-in members will show up here. Check Likes you to see who has expressed interest in you.</p><button className="reset-button" onClick={()=>void load()}><RotateCcw size={16}/> Refresh Discovery</button></div>)}
      {view==='incoming' && (loading ? <div className="feed-loading">Checking your likes…</div> : incoming.length===0 ? <div className="empty-card"><span className="empty-icon"><Heart size={24}/></span><h2>No new likes yet</h2><p>When someone is interested, they’ll appear here. You stay in control of whether you’re interested back.</p></div> : <div className="discovery-list">{incoming.map((person)=><MemberRow key={person.id} member={person} actionLabel="Interested back" icon="heart" disabled={busy} onAction={()=>void act(person,'interested')} />)}</div>)}
      {view==='matches' && (loading ? <div className="feed-loading">Loading your matches…</div> : matches.length===0 ? <div className="empty-card"><span className="empty-icon"><MessageCircle size={24}/></span><h2>No mutual matches yet</h2><p>A private chat opens after you and another member both express interest.</p></div> : <div className="discovery-list">{matches.map((person)=><MemberRow key={person.id} member={person} actionLabel="Message" icon="message" disabled={busy} onAction={()=>void onOpenConversation(person.id).catch((reason)=>setError(reason instanceof Error?reason.message:'Could not open this chat.'))}/>)}</div>)}
      {notice && <div className="discovery-notice" role="status">{notice}{matched&&<button onClick={()=>void onOpenConversation(matched.id).catch((reason)=>setError(reason instanceof Error?reason.message:'Could not open this chat.'))}><MessageCircle size={15}/> Message {matched.display_name}</button>}<button aria-label="Dismiss" onClick={()=>{setNotice('');setMatched(null)}}>×</button></div>}
    </div>
    <aside className="safety-card"><span className="safety-spark">✳</span><div><h3>Keep it easy.</h3><p>Interest is a signal to start a respectful conversation, not a promise. Meet somewhere public, let a friend know, and respect a no.</p><button className="discover-privacy-toggle" disabled={busy} onClick={()=>void toggleEnabled()}>{enabled?'Hide my profile from Discovery':'Enable my profile in Discovery'}</button><span className="broad-area-note">Only your broad area is shared. Exact location is never collected.</span></div></aside>
  </section>
}

function MemberRow({member,actionLabel,icon,disabled,onAction}:{member:Member;actionLabel:string;icon:'heart'|'message';disabled:boolean;onAction:()=>void}){return <article className="discovery-member"><img src={member.avatar_url||avatarFallback(member.display_name)} alt=""/><div className="discovery-member-meta"><strong>{member.display_name}, {member.age}</strong><span>@{member.handle} · {member.broad_area||'Area not shared'}</span>{member.bio&&<small>{member.bio}</small>}</div><button className={icon==='message'?'message-member':'follow-button'} disabled={disabled} onClick={onAction}>{icon==='heart'?<Heart size={15}/>:<MessageCircle size={15}/>} {actionLabel}</button></article>}
