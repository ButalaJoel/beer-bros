import { useState } from 'react'
import { Compass, House, MessageCircle, Search, ShieldCheck, UserRound, Wine } from 'lucide-react'
import Brand from '../components/Brand'
import Discovery from '../features/discovery/Discovery'
import Feed, { FeedRail } from '../features/feed/Feed'

type Page = 'Home' | 'Search' | 'Discover' | 'Messages'
const navItems: { name: Page; icon: typeof House }[] = [
  { name: 'Home', icon: House }, { name: 'Search', icon: Search }, { name: 'Discover', icon: Compass }, { name: 'Messages', icon: MessageCircle },
]

export default function App() {
  const [active, setActive] = useState<Page>('Home')
  const [query, setQuery] = useState('')
  const [following, setFollowing] = useState<string[]>(['maya.n'])
  const [ageNoticeVisible, setAgeNoticeVisible] = useState(true)
  const toggleFollow = (handle: string) => setFollowing((current) => current.includes(handle) ? current.filter((item) => item !== handle) : [...current, handle])

  return <div id="top" className="app-shell">
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{navItems.map(({ name, icon: Icon }) => <button key={name} className={`nav-link ${active === name ? 'active' : ''}`} onClick={() => setActive(name)}><Icon size={17} />{name}{name === 'Messages' && <span className="nav-badge">1</span>}</button>)}</nav><div className="topbar-actions">{active === 'Search' ? <label className="top-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, stories…" aria-label="Search people and stories" autoFocus /></label> : <button className="location-button" aria-label="Current community is Kampala"><span className="location-pip" /><span>Kampala, Uganda</span><Wine size={15} /></button>}<button className="avatar-button" aria-label="Open your profile"><UserRound size={18} /></button></div></div></header>
    <main>
      {ageNoticeVisible && <div className="demo-banner"><span className="demo-banner-dot" /><span><strong>18+ LOCAL DEMO</strong> — Sample accounts and stories. Nothing here is saved or shared.</span><button aria-label="Dismiss demo notice" onClick={() => setAgeNoticeVisible(false)}>×</button></div>}
      <div className={`social-layout ${active === 'Discover' ? 'discover-page' : ''}`}>
        {active === 'Discover' ? <Discovery /> : <><Feed mode={active} query={query} /><FeedRail following={following} onFollow={toggleFollow} /></>}
      </div>
    </main>
    <footer className="page-footer" id="community-guidelines"><span>© 2026 Beer BROS</span><span className="footer-note"><ShieldCheck size={14} /> Adults 18+ · Drink responsibly · Respect boundaries</span><a href="#community-guidelines">Safety & privacy</a></footer>
  </div>
}
