import { useState } from 'react'
import { Heart, RotateCcw, X } from 'lucide-react'
import { profiles } from '../../data/profiles'
import type { DiscoveryAction } from '../../types'
import ProfileCard from '../../components/ProfileCard'

export default function Discovery() {
  const [index, setIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const profile = profiles[index]

  const act = (action: DiscoveryAction) => {
    if (!profile) return
    setNotice(action === 'like' ? `You’re interested in ${profile.name}. Demo action only.` : `You passed on ${profile.name}.`)
    setIndex((current) => current + 1)
  }

  const reset = () => { setIndex(0); setNotice('Demo profiles reset.') }

  return <section className="discovery-layout" aria-labelledby="discover-title">
    <div className="discovery-main">
      <div className="section-head"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR NEIGHBOURHOOD</div><h1 id="discover-title">A good night starts<br className="desktop-break" /> with <em>good company.</em></h1><p className="section-subtitle">Meet people nearby who are open to a relaxed drink and a real conversation.</p></div><div className="profile-count"><span className="count-mark" />{profile ? `${index + 1} of ${profiles.length}` : 'All caught up'}</div></div>
      {profile ? <>
        <div className="card-stage" key={profile.id}><ProfileCard profile={profile} /></div>
        <div className="action-row" aria-label="Profile actions"><button className="action-button pass-button" onClick={() => act('pass')} aria-label="Pass on profile"><X size={23} /><span>Pass</span></button><button className="action-button like-button" onClick={() => act('like')} aria-label="Express interest"><Heart size={22} fill="currentColor" /><span>Interested</span></button></div>
        <p className="swipe-hint">Choose what feels right. You can change your mind later.</p>
        <div className="sr-only" aria-live="polite">{notice}</div>
      </> : <div className="empty-card"><span className="empty-icon"><Heart size={24} /></span><h2>You’re all caught up</h2><p>That’s everyone in your neighbourhood for now. Take a breather and come back soon.</p><button className="reset-button" onClick={reset}><RotateCcw size={16} /> Start again</button></div>}
    </div>
    <aside className="safety-card"><span className="safety-spark">✳</span><div><h3>Keep it easy.</h3><p>Good connections start with respect. Meet somewhere public, let a friend know your plans, and look out for each other.</p><a href="#safety">Our community promise <span>↗</span></a></div></aside>
  </section>
}
