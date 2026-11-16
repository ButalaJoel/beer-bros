import { FormEvent, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { api, CurrentUser } from '../../lib/api/client'

export default function AuthPanel({ onSignedIn }: { onSignedIn: (user: CurrentUser) => void }) {
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const data = new FormData(event.currentTarget)
    const payload = Object.fromEntries(data.entries())
    try {
      const result = await api<{user: CurrentUser}>(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(register ? { ...payload, discoveryEnabled: data.get('discoveryEnabled') === 'on', acceptedResponsibleUse: true } : payload) })
      onSignedIn(result.user)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not sign in. Try again.') }
    finally { setBusy(false) }
  }
  return <main className="auth-page"><section className="auth-card"><div className="eyebrow"><span className="eyebrow-line"/> MEMBER ACCOUNT</div><h1>{register ? 'Join the ' : 'Welcome '}<em>community.</em></h1><p>Stories and messages are saved to your Beer BROS account.</p><form onSubmit={submit} className="auth-form">
    {register && <><label>Display name<input name="displayName" autoComplete="name" required maxLength={60}/></label><label>Username<input name="handle" autoComplete="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+"/><small>3–24 letters, numbers or underscores</small></label><label>Date of birth<input name="dateOfBirth" type="date" required/></label><label>Short bio (optional)<input name="bio" maxLength={300} placeholder="A little about you"/></label><label>Broad area (optional)<input name="broadArea" maxLength={60} placeholder="For example, Kololo or Ntinda"/><small>Do not enter a street address or exact location.</small></label></>}
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : 1} maxLength={128}/>{register && <small>At least 12 characters</small>}</label>
    {register && <><label className="discovery-opt-in"><input type="checkbox" name="discoveryEnabled"/> Include my profile in Discovery so other opted-in adults can express interest. Only my broad area is shown.</label><p className="auth-safety"><ShieldCheck size={16}/> You must be 18 or older. Please socialise responsibly and respect boundaries.</p></>}
    {error && <p role="alert" className="auth-error">{error}</p>}<button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}</button>
  </form><button className="auth-switch" onClick={()=>{setError('');setRegister(!register)}}>{register ? 'Already a member? Log in' : 'New here? Create an 18+ account'}</button><div className="auth-foot">Secure session · Your password is encrypted · Exact location is never shown</div></section></main>
}
