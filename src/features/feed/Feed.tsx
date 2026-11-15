import { useMemo, useState } from 'react'
import { Bookmark, Check, Heart, Image as ImageIcon, MapPin, MessageCircle, MoreHorizontal, Search, Send, ShieldCheck, Smile, Sparkles, UserPlus } from 'lucide-react'
import { profiles } from '../../data/profiles'
import { stories, type Story } from '../../data/stories'

type FeedProps = { mode: 'Home' | 'Search' | 'Messages'; query: string }

function StoryPost({ story, onFollow, following }: { story: Story; onFollow: () => void; following: boolean }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  return <article className="story-post">
    <div className="post-author"><img src={story.avatar} alt="" /><div className="author-lines"><strong>{story.author}</strong><span>@{story.handle} <i>·</i> {story.location} <i>·</i> {story.time}</span></div><button className={`follow-button ${following ? 'following' : ''}`} onClick={onFollow}>{following ? <><Check size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}</button><button className="post-more" aria-label="More story options"><MoreHorizontal size={20} /></button></div>
    <p className="post-copy">{story.text}</p>
    {story.image && <img className="post-image" src={story.image} alt="A warmly lit rooftop restaurant in Kampala" />}
    <div className="post-tags">{story.topics.map((topic) => <span key={topic}>#{topic.split(' ').join('')}</span>)}</div>
    <div className="post-actions"><button className={liked ? 'liked' : ''} onClick={() => setLiked(!liked)} aria-label={liked ? 'Unlike story' : 'Like story'}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /> {story.likes + (liked ? 1 : 0)}</button><button onClick={() => setCommentsOpen(!commentsOpen)} aria-expanded={commentsOpen}><MessageCircle size={17} /> {story.comments} <span>Replies</span></button><button className={saved ? 'saved' : ''} onClick={() => setSaved(!saved)} aria-label={saved ? 'Remove bookmark' : 'Bookmark story'}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></button><button aria-label="Share story"><Send size={16} /></button></div>
    {commentsOpen && <div className="reply-box"><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&h=80&q=80" alt="Your demo profile" /><input aria-label="Write a reply" placeholder="Add something kind to the conversation…" /><button aria-label="Send reply"><Send size={15} /></button></div>}
  </article>
}

function Composer({ onPublish }: { onPublish: (text: string) => void }) {
  const [text, setText] = useState('')
  const publish = () => { if (text.trim()) { onPublish(text.trim()); setText('') } }
  return <form className="composer" onSubmit={(event) => { event.preventDefault(); publish() }}><div className="composer-top"><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&h=80&q=80" alt="Your demo profile" /><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="What’s a night you’ll always remember?" aria-label="Write your story" maxLength={500} /></div><div className="composer-bottom"><span><ImageIcon size={16} /> Photo <Smile size={16} /> Feeling <span className="composer-count">{text.length}/500</span></span><button type="submit" disabled={!text.trim()}><Sparkles size={14} /> Share story</button></div><div className="demo-hint">Keep it kind, keep it yours. Stories are local demo content and disappear when you reload.</div></form>
}

export default function Feed({ mode, query }: FeedProps) {
  const [items, setItems] = useState(stories)
  const [following, setFollowing] = useState<string[]>(['maya.n'])
  const [activeFilter, setActiveFilter] = useState('For you')
  const publish = (text: string) => setItems((current) => [{ id: `local-${Date.now()}`, author: 'Joel', handle: 'you', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80', location: 'Kampala', time: 'Just now', text, topics: [], likes: 0, comments: 0 }, ...current])
  const visible = useMemo(() => {
    let result = items
    if (mode === 'Search' && query.trim()) {
      const term = query.toLowerCase().replace(/^#/, '')
      result = result.filter((post) => `${post.author} ${post.handle} ${post.location} ${post.text} ${post.topics.join(' ')}`.toLowerCase().includes(term))
    }
    if (activeFilter === 'Following') result = result.filter((post) => following.includes(post.handle) || post.handle === 'you')
    return result
  }, [activeFilter, following, items, mode, query])

  if (mode === 'Messages') return <Messages />
  return <div className="feed-column">
    {mode === 'Search' && <div className="search-results-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> SEARCH THE COMMUNITY</div><h1>Find your <em>people.</em></h1><p>{query ? `Showing story matches for “${query}”` : 'Search stories, people and places from the community.'}</p></div><div className="search-count"><Search size={15} /> {visible.length} stories</div></div>}
    {mode === 'Home' && <div className="feed-welcome"><div><div className="eyebrow"><span className="eyebrow-line" /> SUNDAY, KAMPALA</div><h1>Your stories. <em>Your people.</em></h1><p>A little corner for the nights and people you’ll remember.</p></div><span className="welcome-flower">✳</span></div>}
    {mode === 'Home' && <div className="moment-strip"><div><span className="moment-add">+</span><span>Your moment</span></div><div><img src={stories[0].avatar} alt="" /><span>Maya</span></div><div><img src={stories[1].avatar} alt="" /><span>Brian</span></div><div><img src={stories[2].avatar} alt="" /><span>Aisha</span></div><div><span className="moment-avatar">J</span><span>Joel</span></div></div>}
    {mode === 'Home' && <Composer onPublish={publish} />}
    <div className="feed-filter">{['For you', 'Following', 'Recent'].map((filter) => <button key={filter} className={activeFilter === filter ? 'selected' : ''} onClick={() => setActiveFilter(filter)}>{filter}</button>)}<span className="feed-filter-label">Stories from the community</span></div>
    {visible.length ? visible.map((story) => <StoryPost key={story.id} story={story} following={following.includes(story.handle)} onFollow={() => setFollowing((current) => current.includes(story.handle) ? current.filter((handle) => handle !== story.handle) : [...current, story.handle])} />) : <div className="feed-empty"><Search size={22} /><h2>No stories found</h2><p>Try a different name, topic, or place.</p></div>}
  </div>
}

function Messages() {
  const threads = [{ name: 'Maya Namusoke', handle: '@maya.n', preview: 'That rooftop sounds perfect for next Friday ✨', time: '12m', photo: stories[0].avatar, unread: true }, { name: 'Brian Kato', handle: '@briankato', preview: 'We should get the quiz team together again!', time: '2h', photo: stories[1].avatar }, { name: 'Aisha Akena', handle: '@aisha.creates', preview: 'Sent you a story', time: '1d', photo: stories[2].avatar }]
  return <div className="messages-view"><div className="message-heading"><div className="eyebrow"><span className="eyebrow-line" /> YOUR INBOX</div><h1>Good chats start <em>here.</em></h1><p>Your conversations with the people you’ve connected with.</p></div><div className="message-panel"><aside className="thread-list"><div className="thread-title"><h2>Messages</h2><button aria-label="Search messages"><Search size={17} /></button></div>{threads.map((thread) => <button className="thread-item" key={thread.handle}><img src={thread.photo} alt="" /><span className="thread-meta"><strong>{thread.name}</strong><small>{thread.preview}</small></span><span className="thread-time">{thread.time}{thread.unread && <i />}</span></button>)}</aside><div className="thread-placeholder"><span className="chat-icon"><MessageCircle size={25} /></span><h2>Pick up a good conversation</h2><p>Choose a chat to see the messages here. Be respectful, and remember you can block or report at any time.</p><span className="demo-chat-label"><ShieldCheck size={14} /> Demo inbox · Messages aren’t sent</span></div></div></div>
}

export function FeedRail({ onFollow, following }: { onFollow: (handle: string) => void; following: string[] }) {
  return <aside className="feed-rail"><section className="rail-card"><div className="rail-heading"><h3>People to know</h3><button>See all</button></div>{profiles.slice(0, 3).map((person, index) => { const handle = ['maya.n', 'briankato', 'aisha.creates'][index]; return <div className="suggestion" key={person.id}><img src={person.image} alt="" /><div><strong>{person.name}</strong><span>{person.area} · {person.interests[0]}</span></div><button onClick={() => onFollow(handle)} aria-label={`${following.includes(handle) ? 'Unfollow' : 'Follow'} ${person.name}`}>{following.includes(handle) ? <Check size={15} /> : <UserPlus size={15} />}</button></div> })}</section><section className="community-card"><span><ShieldCheck size={16} /></span><div><h3>Good company, good care.</h3><p>Share stories with respect. Drink responsibly, meet publicly, and look out for your people.</p><a href="#community-guidelines">Community guidelines ↗</a></div></section><div className="rail-footer"><span>© 2026 Beer BROS</span><span>Adults 18+ · Be kind out there</span><MapPin size={13} /> Kampala, Uganda</div></aside>
}
