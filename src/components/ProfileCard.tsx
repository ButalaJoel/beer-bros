import { BadgeCheck, MapPin, Wine } from 'lucide-react'
import { findDrink } from '../data/drinks'
import type { Profile } from '../types'

export default function ProfileCard({ profile }: { profile: Profile }) {
  const drink = findDrink(profile.drinkId)
  return <article className="profile-card" aria-label={`${profile.name}, ${profile.age}`}>
    <img className="profile-photo" src={profile.image} alt={`${profile.name}'s profile`} />
    <div className="photo-shade" />
    <div className="photo-topline"><span className="demo-pill"><span className="pulse-dot" /> Demo profiles</span><button className="icon-button photo-menu" aria-label="Profile safety options" title="Safety options">•••</button></div>
    <div className="profile-content">
      <div className="profile-heading"><div><h2>{profile.name}, {profile.age} {profile.verified && <BadgeCheck className="verified" size={19} aria-label="Verified profile" />}</h2><div className="profile-location"><MapPin size={14} /> {profile.area} <span className="location-separator">·</span> {profile.distance}</div></div>{profile.online && <span className="online-label"><i /> Online</span>}</div>
      {drink && <div className="drink-chip"><Wine size={14} /><span>Drinking <strong>{drink.name}</strong></span></div>}
      <p className="profile-bio">{profile.bio}</p>
      <div className="interest-list">{profile.interests.map((interest) => <span key={interest}>{interest}</span>)}</div>
    </div>
  </article>
}
