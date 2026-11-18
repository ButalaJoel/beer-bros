import { mediaUrl } from '../lib/api/client'

const palette = ['#f5b82e', '#e8743b', '#4fb5a5', '#8f7cf0', '#e05d7a', '#5aa0e6', '#9cc95a']

export default function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const src = mediaUrl(url)
  if (src) return <img className="x-avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
  const letter = (name.trim()[0] ?? '?').toUpperCase()
  const color = palette[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length]
  return <span className="x-avatar x-avatar-letter" aria-hidden="true" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>{letter}</span>
}
