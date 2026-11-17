import { FormEvent, useState } from 'react'
import { Beer, ShieldCheck } from 'lucide-react'
import { api, CurrentUser } from '../../lib/api/client'

export default function AuthPanel({ onSignedIn }: { onSignedIn: (user: CurrentUser) => void }) {
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? ''); const password = String(data.get('password') ?? '')
    const payload = register
      ? { displayName: String(data.get('displayName') ?? ''), email, password, dateOfBirth: String(data.get('dateOfBirth') ?? ''), discoveryEnabled: data.get('discoveryEnabled') === 'on', acceptedResponsibleUse: true }
      : { email, password }
    try {
      const result = await api<{user: CurrentUser}>(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(payload) })
      onSignedIn(result.user)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not sign in. Try again.') }
    finally { setBusy(false) }
  }
  return <main className="x-auth">
    <section className="x-auth-card">
      <span className="x-auth-logo"><Beer size={40} strokeWidth={2.2} /></span>
      <h1>{register ? 'Create your account' : 'Find your drinking buddy.'}</h1>
      {!register && <p className="x-auth-lead">Post where you’re drinking, see where the vibe is, and swipe to meet good company nearby.</p>}
      <form onSubmit={submit} className="x-auth-form">
        {register && <input name="displayName" autoComplete="name" required maxLength={60} placeholder="Name" aria-label="Name" />}
        <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Email" aria-label="Email" />
        <input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : 1} maxLength={128} placeholder={register ? 'Password (8+ characters)' : 'Password'} aria-label="Password" />
        {register && <>
          <label className="x-auth-dob">Date of birth<span>You must be 18 or older. This isn’t shown publicly.</span><input name="dateOfBirth" type="date" required aria-label="Date of birth" /></label>
          <label className="x-auth-check"><input type="checkbox" name="discoveryEnabled" /> Show me in Discover so people nearby can swipe on me</label>
        </>}
        {error && <p role="alert" className="x-auth-error">{error}</p>}
        <button className="x-auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Sign up' : 'Log in'}</button>
      </form>
      <p className="x-auth-switch">{register ? 'Have an account already?' : 'Don’t have an account?'} <button onClick={() => { setError(''); setRegister(!register) }}>{register ? 'Log in' : 'Sign up'}</button></p>
      <p className="x-auth-foot"><ShieldCheck size={14} /> Adults 18+ · Drink responsibly · Your exact location is never shown</p>
    </section>
  </main>
}
