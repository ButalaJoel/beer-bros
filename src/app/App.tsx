import { useEffect, useState } from 'react'
import { Beer, Compass, House, LogOut, Mail, PenLine, Search, Settings2, ShieldCheck } from 'lucide-react'
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
  useEffect(() => { api<{user: CurrentUser}>('/auth/me').then((result) => setUser(result.user)).catch((reason) => { if (reason instanceof TypeError) setError('The server could not be reached. Check the API deployment and retry.') }).finally(() => setAuthReady(true)) }, [])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [active])
  if (!authReady) return <div className="x-auth"><span className="x-spinner" aria-label="Loading" /></div>
  if (!user) return <div className="app-shell">{error && <div className="connection-error" role="alert">{error}</div>}<AuthPanel onSignedIn={(signedIn) => { setUser(signedIn); setError('') }} /></div>
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }) } finally { setUser(null); setActive('Home') } }
  const items = user.isAdmin ? [...navItems, { name: 'Admin' as Page, label: 'Admin', icon: Settings2 }] : navItems
  const compose = () => { setActive('Home'); setComposeSignal((n) => n + 1) }
  const search = (value: string) => { setQuery(value); setActive('Search') }

  return <div id="top" className="x-shell">
    <aside className="x-sidebar">
      <div className="x-sidebar-inner">
        <a className="x-logo" href="#top" aria-label="Beer BROS home" onClick={() => setActive('Home')}><Beer size={26} strokeWidth={2.2} /></a>
        <nav aria-label="Main navigation">{items.map(({ name, label, icon: Icon }) => <button key={name} className={`x-nav-item ${active === name ? 'active' : ''}`} onClick={() => setActive(name)} aria-current={active === name ? 'page' : undefined}><Icon size={26} strokeWidth={active === name ? 2.6 : 1.9} /><span>{label}</span></button>)}</nav>
        <button className="x-post-button" onClick={compose}><PenLine size={22} className="x-post-icon" /><span>Post</span></button>
        <div className="x-account">
          <Avatar name={user.displayName} size={40} />
          <div className="x-account-names"><strong>{user.displayName}</strong><span>@{user.handle}</span></div>
          <button onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </div>
    </aside>

    <main className={`x-main ${active === 'Discover' ? 'x-main-discover' : ''}`}>
      <header className="x-mobile-top"><button className="x-mobile-avatar" onClick={logout} aria-label="Log out"><Avatar name={user.displayName} size={32} /></button><Beer size={24} className="x-mobile-logo" /><span className="x-mobile-spacer" /></header>
      {active === 'Admin' ? <><div className="x-page-header"><h1>Admin</h1></div><AdminDashboard /></>
        : active === 'Discover' ? <><div className="x-page-header"><h1>Discover</h1><p>Swipe to find a drinking buddy nearby</p></div><Discovery onOpenConversation={async (otherUserId) => { await api('/conversations', { method: 'POST', body: JSON.stringify({ otherUserId }) }); setActive('Messages') }} /></>
        : <Feed mode={active} query={query} onQueryChange={setQuery} currentUser={user} composeSignal={composeSignal} announcements={active === 'Home' ? <AnnouncementNotices /> : null} />}
    </main>

    <aside className="x-aside">
      {active !== 'Search' && <label className="x-search"><Search size={17} /><input placeholder="Search Beer BROS" aria-label="Search people and posts" onKeyDown={(event) => { if (event.key === 'Enter') search(event.currentTarget.value) }} /></label>}
      <FeedRail />
      <footer className="x-aside-footer" id="community-guidelines"><ShieldCheck size={13} /> Adults 18+ · Drink responsibly · Meet in public · © 2026 Beer BROS</footer>
    </aside>

    <nav className="x-bottom-nav" aria-label="Main navigation">{items.map(({ name, label, icon: Icon }) => <button key={name} className={active === name ? 'active' : ''} onClick={() => setActive(name)} aria-label={label}><Icon size={24} strokeWidth={active === name ? 2.6 : 1.9} /></button>)}</nav>
    {active === 'Home' && <button className="x-fab" onClick={compose} aria-label="New post"><PenLine size={22} /></button>}
  </div>
}
