import { useEffect, useState } from 'react'
import { Compass, House, LogOut, MessageCircle, Search, ShieldCheck, Wine } from 'lucide-react'
import Brand from '../components/Brand'
import Discovery from '../features/discovery/Discovery'
import Feed, { FeedRail } from '../features/feed/Feed'
import AuthPanel from '../features/auth/AuthPanel'
import { api, CurrentUser } from '../lib/api/client'

type Page = 'Home' | 'Search' | 'Discover' | 'Messages'
const navItems: { name: Page; icon: typeof House }[] = [
  { name: 'Home', icon: House }, { name: 'Search', icon: Search }, { name: 'Discover', icon: Compass }, { name: 'Messages', icon: MessageCircle },
]

export default function App() {
  const [active, setActive] = useState<Page>('Home')
  const [query, setQuery] = useState('')
  const [ageNoticeVisible, setAgeNoticeVisible] = useState(true)
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { api<{user: CurrentUser}>('/auth/me').then((result) => setUser(result.user)).catch((reason) => { if (reason instanceof TypeError) setError('The server could not be reached. Check the API deployment and retry.') }).finally(() => setAuthReady(true)) }, [])
  if (!authReady) return <div className="app-shell"><div className="auth-loading">Connecting securely to Beer BROS…</div></div>
  if (!user) return <div className="app-shell"><header className="topbar"><div className="topbar-inner"><Brand /></div></header>{error && <div className="connection-error" role="alert">{error}</div>}<AuthPanel onSignedIn={(signedIn) => { setUser(signedIn); setError('') }} /></div>
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }) } finally { setUser(null); setActive('Home') } }

  return <div id="top" className="app-shell">
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{navItems.map(({ name, icon: Icon }) => <button key={name} className={`nav-link ${active === name ? 'active' : ''}`} onClick={() => setActive(name)}><Icon size={17} />{name}</button>)}</nav><div className="topbar-actions">{active === 'Search' ? <label className="top-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, stories…" aria-label="Search people and stories" /></label> : <div className="location-button" aria-label="Community area"><span className="location-pip" /><span>Kampala community</span><Wine size={15} /> </div>}<button className="avatar-button" aria-label="Log out" title={`${user.displayName} · Log out`} onClick={logout}><LogOut size={17} /></button></div><nav className="mobile-nav" aria-label="Main navigation">{navItems.map(({name,icon:Icon})=><button key={name} className={active===name?'active':''} onClick={()=>setActive(name)}><Icon size={17}/>{name}</button>)}</nav></div></header>
    <main>
      {ageNoticeVisible && <div className="demo-banner"><span className="demo-banner-dot" /><span><strong>18+ MEMBER PREVIEW</strong> — Your stories and messages are saved to your account.</span><button aria-label="Dismiss notice" onClick={() => setAgeNoticeVisible(false)}>×</button></div>}
      <div className={`social-layout ${active === 'Discover' ? 'discover-page' : ''}`}>
        {active === 'Discover' ? <Discovery /> : <><Feed mode={active} query={query} onStartConversation={async (otherUserId) => { await api('/conversations', { method: 'POST', body: JSON.stringify({ otherUserId }) }); setActive('Messages') }} /><FeedRail /></>}
      </div>
    </main>
    <footer className="page-footer" id="community-guidelines"><span>© 2026 Beer BROS</span><span className="footer-note"><ShieldCheck size={14} /> Adults 18+ · Drink responsibly · Respect boundaries</span><a href="#community-guidelines">Safety & privacy</a></footer>
  </div>
}
