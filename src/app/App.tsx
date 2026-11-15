import { useState } from 'react'
import { Compass, Heart, Menu, MessageCircle, ShieldCheck, SlidersHorizontal, UserRound, X } from 'lucide-react'
import Brand from '../components/Brand'
import Discovery from '../features/discovery/Discovery'

export default function App() {
  const [active, setActive] = useState('Discover')
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = [{ name: 'Discover', icon: Compass }, { name: 'Likes', icon: Heart }, { name: 'Chats', icon: MessageCircle }]
  return <div id="top" className="app-shell">
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{navItems.map(({ name, icon: Icon }) => <button key={name} className={`nav-link ${active === name ? 'active' : ''}`} onClick={() => setActive(name)}><Icon size={17} />{name}{name === 'Likes' && <span className="nav-badge">2</span>}</button>)}</nav><div className="topbar-actions"><button className="location-button" aria-label="Discovery location is Kampala"><span className="location-pip" /><span>Kampala, Uganda</span><SlidersHorizontal size={15} /></button><button className="avatar-button" aria-label="Open profile menu"><UserRound size={18} /></button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>{menuOpen ? <X /> : <Menu />}</button></div></div>{menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map(({ name, icon: Icon }) => <button key={name} onClick={() => { setActive(name); setMenuOpen(false) }}><Icon size={18} />{name}</button>)}</nav>}</header>
    <main><div className="demo-banner"><span className="demo-banner-dot" /><span><strong>LOCAL DEMO</strong> — Profiles and actions are for preview only. Nothing is saved or shared.</span><button aria-label="Dismiss demo notice" onClick={(e) => e.currentTarget.parentElement?.remove()}><X size={15} /></button></div><Discovery /></main>
    <footer className="page-footer" id="safety"><span>© 2026 Beer BROS</span><span className="footer-note"><ShieldCheck size={14} /> Adults 18+ · Drink responsibly · Respect boundaries</span><a href="#safety">Safety & privacy</a></footer>
    {active !== 'Discover' && <div className="section-toast" role="status"><span>{active === 'Likes' ? 'Your likes will appear here in the full experience.' : 'Your conversations will appear here after a mutual match.'}</span><button onClick={() => setActive('Discover')} aria-label="Return to Discover"><X size={15} /></button></div>}
  </div>
}
