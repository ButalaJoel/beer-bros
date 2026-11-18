import { useEffect, useState } from 'react'
import { Beer, Compass, House, LogIn, LogOut, Mail, PenLine, Search, Settings2, ShieldCheck, X } from 'lucide-react'
import Avatar from '../components/Avatar'
import Discovery from '../features/discovery/Discovery'
import Feed, { FeedRail } from '../features/feed/Feed'
import AuthPanel from '../features/auth/AuthPanel'
import AdminDashboard, { AnnouncementNotices } from '../features/admin/AdminDashboard'
import { api, CurrentUser } from '../lib/api/client'
import '../x-layout.css'

type Page = 'Home' | 'Search' | 'Discover' | 'Messages' | 'Admin'
const navItems: { name: Page; label: string; icon: typeof House }[] = [
  { name: 'Home', label: 'Home', icon: House },
  { name: 'Search', label: 'Explore', icon: Search },
  { name: 'Discover', label: 'Discover', icon: Compass },
  { name: 'Messages', label: 'Messages', icon: Mail },
]

export default function App() {
  const [active, setActive] = useState<Page>('Home')
  const [query, setQuery] = useState('')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [error, setError] = useState('')
  const [composeSignal, setComposeSignal] = useState(0)
  const [authView, setAuthView] = useState<null | 'login' | 'register'>(null)
  const [joinReason, setJoinReason] = useState('')
  useEffect(() => { api<{user: CurrentUser}>('/auth/me').then((result) => setUser(result.user)).catch((reason) => { if (reason instanceof TypeError) setError('The server could not be reached. Check the API deployment and retry.') }).finally(() => setAuthReady(true)) }, [])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [active])
  if (!authReady) return <div className="x-auth"><span className="x-spinner" aria-label="Loading" /></div>
  if (!user && authView) return <div className="app-shell">{error && <div className="connection-error" role="alert">{error}</div>}<AuthPanel key={authView} initialMode={authView} onBack={() => setAuthView(null)} onSignedIn={(signedIn) => { setUser(signedIn); setError(''); setAuthView(null); setJoinReason('') }} /></div>
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }) } finally { setUser(null); setActive('Home') } }
  const items = user?.isAdmin ? [...navItems, { name: 'Admin' as Page, label: 'Admin', icon: Settings2 }] : navItems
  const askToJoin = (reason: string) => setJoinReason(reason)
  const openPage = (name: Page) => {
    if (!user && name !== 'Home') return askToJoin(name === 'Discover' ? 'Create a free account to swipe and find a drinking buddy nearby.' : name === 'Messages' ? 'Create a free account to message the people you match with.' : 'Create a free account to search people and posts.')
    setActive(name)
  }
  const compose = () => { if (!user) return askToJoin('Create a free account to post where you’re drinking.'); setActive('Home'); setComposeSignal((n) => n + 1) }
  const search = (value: string) => { if (!user) return askToJoin('Create a free account to search people and posts.'); setQuery(value); setActive('Search') }

  return <div id="top" className="x-shell">
    <aside className="x-sidebar">
      <div className="x-sidebar-inner">
        <a className="x-logo" href="#top" aria-label="Beer BROS home" onClick={() => setActive('Home')}><Beer size={26} strokeWidth={2.2} /></a>
        <nav aria-label="Main navigation">{items.map(({ name, label, icon: Icon }) => <button key={name} className={`x-nav-item ${active === name ? 'active' : ''}`} onClick={() => openPage(name)} aria-current={active === name ? 'page' : undefined}><Icon size={26} strokeWidth={active === name ? 2.6 : 1.9} /><span>{label}</span></button>)}</nav>
        <button className="x-post-button" onClick={compose}><PenLine size={22} className="x-post-icon" /><span>Post</span></button>
        {user ? <div className="x-account">
          <Avatar name={user.displayName} size={40} />
          <div className="x-account-names"><strong>{user.displayName}</strong><span>@{user.handle}</span></div>
          <button onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div> : <button className="x-account x-account-guest" onClick={() => setAuthView('login')}><LogIn size={20} /><span className="x-account-names"><strong>Log in</strong></span></button>}
      </div>
    </aside>

    <main className={`x-main ${active === 'Discover' ? 'x-main-discover' : ''}`}>
      <header className="x-mobile-top">{user ? <button className="x-mobile-avatar" onClick={logout} aria-label="Log out"><Avatar name={user.displayName} size={32} /></button> : <button className="x-mobile-login" onClick={() => setAuthView('login')}>Log in</button>}<Beer size={24} className="x-mobile-logo" />{user ? <span className="x-mobile-spacer" /> : <button className="x-mobile-join" onClick={() => setAuthView('register')}>Sign up</button>}</header>
      {active === 'Admin' ? <><div className="x-page-header"><h1>Admin</h1></div><AdminDashboard /></>
        : active === 'Discover' ? <><div className="x-page-header"><h1>Discover</h1><p>Swipe to find a drinking buddy nearby</p></div><Discovery onOpenConversation={async (otherUserId) => { await api('/conversations', { method: 'POST', body: JSON.stringify({ otherUserId }) }); setActive('Messages') }} /></>
        : <Feed mode={user ? active : 'Home'} query={query} onQueryChange={setQuery} currentUser={user} composeSignal={composeSignal} onRequireAccount={askToJoin} onJoin={() => setAuthView('register')} announcements={active === 'Home' ? <AnnouncementNotices /> : null} />}
    </main>

    <aside className="x-aside">
      {active !== 'Search' && <label className="x-search"><Search size={17} /><input placeholder="Search Beer BROS" aria-label="Search people and posts" onKeyDown={(event) => { if (event.key === 'Enter') search(event.currentTarget.value) }} /></label>}
      {!user && <section className="x-card x-join-card"><h2>New to Beer BROS?</h2><p className="x-card-copy">Free to join — no fees and no card needed. Sign up to post, like, swipe and chat.</p><div className="x-join-actions"><button className="x-primary x-join-wide" onClick={() => setAuthView('register')}>Create free account</button><button className="x-ghost x-join-wide" onClick={() => setAuthView('login')}>Log in</button></div></section>}
      <FeedRail />
      <footer className="x-aside-footer" id="community-guidelines"><ShieldCheck size={13} /> Adults 18+ · Drink responsibly · Meet in public · © 2026 Beer BROS</footer>
    </aside>

    <nav className="x-bottom-nav" aria-label="Main navigation">{items.map(({ name, label, icon: Icon }) => <button key={name} className={active === name ? 'active' : ''} onClick={() => openPage(name)} aria-label={label}><Icon size={24} strokeWidth={active === name ? 2.6 : 1.9} /></button>)}</nav>
    {!user && <div className="x-guest-bar"><div><strong>Don’t miss what’s happening tonight</strong><span>Beer BROS is free. Join to post, like, swipe and chat.</span></div><button className="x-ghost" onClick={() => setAuthView('login')}>Log in</button><button className="x-primary" onClick={() => setAuthView('register')}>Sign up</button></div>}
    {joinReason && <div className="x-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="join-title" onClick={() => setJoinReason('')}><div className="x-modal" onClick={(event) => event.stopPropagation()}><button className="x-modal-close" onClick={() => setJoinReason('')} aria-label="Close"><X size={20} /></button><Beer size={34} className="x-modal-logo" /><h2 id="join-title">Join Beer BROS — it’s free</h2><p>{joinReason}</p><p className="x-muted">No fees, no card. Just your name, email, password and birthday (18+).</p><button className="x-primary x-modal-wide" onClick={() => { setJoinReason(''); setAuthView('register') }}>Create free account</button><button className="x-ghost x-modal-wide" onClick={() => { setJoinReason(''); setAuthView('login') }}>Log in</button></div></div>}
    {user && active === 'Home' && <button className="x-fab" onClick={compose} aria-label="New post"><PenLine size={22} /></button>}
  </div>
}
