import { FormEvent, InputHTMLAttributes, useState } from 'react'
import { ArrowLeft, Beer, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { api, CurrentUser } from '../../lib/api/client'

/** Password box with a show/hide eye, so people can check what they typed. */
function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return <div className="x-password">
    <input {...props} type={visible ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
    <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
  </div>
}

export default function AuthPanel({ onSignedIn, initialMode = 'login', onBack }: { onSignedIn: (user: CurrentUser) => void; initialMode?: 'login' | 'register'; onBack?: () => void }) {
  const [register, setRegister] = useState(initialMode === 'register')
  const [resetStep, setResetStep] = useState<'none' | 'email' | 'code'>('none')
  const [resetEmail, setResetEmail] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function requestCode(email: string) {
    setError(''); setInfo(''); setBusy(true)
    try { const result = await api<{message: string}>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }); setResetEmail(email); setInfo(result.message + ' Check your spam folder too.'); setResetStep('code') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not send a code. Try again.') }
    finally { setBusy(false) }
  }
  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    if (resetStep === 'email') return void requestCode(String(data.get('email') ?? '').trim())
    setError(''); setBusy(true)
    try { const result = await api<{user: CurrentUser}>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ email: resetEmail, code: String(data.get('code') ?? '').trim(), password: String(data.get('password') ?? '') }) }); onSignedIn(result.user) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not reset your password.') }
    finally { setBusy(false) }
  }
  const backToLogin = () => { setResetStep('none'); setError(''); setInfo('') }
  if (resetStep !== 'none') return <main className="x-auth">
    <section className="x-auth-card">
      <span className="x-auth-logo"><Beer size={40} strokeWidth={2.2} /></span>
      <h1>{resetStep === 'email' ? 'Find your account' : 'Check your email'}</h1>
      <p className="x-auth-lead">{resetStep === 'email' ? 'Enter the email you signed up with and we’ll send you a 6-digit code.' : info}</p>
      <form onSubmit={submitReset} className="x-auth-form" key={resetStep}>
        {resetStep === 'email'
          ? <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Email" aria-label="Email" defaultValue={resetEmail} />
          : <>
            <input name="code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} placeholder="6-digit code" aria-label="6-digit code" className="x-auth-code" />
            <PasswordInput name="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="New password (8+ characters)" aria-label="New password" />
          </>}
        {error && <p role="alert" className="x-auth-error">{error}</p>}
        <button className="x-auth-submit" disabled={busy}>{busy ? 'Please wait…' : resetStep === 'email' ? 'Send code' : 'Reset password and log in'}</button>
      </form>
      {resetStep === 'code' && <p className="x-auth-switch">No email? <button disabled={busy} onClick={() => void requestCode(resetEmail)}>Send a new code</button></p>}
      <p className="x-auth-switch"><button onClick={backToLogin}>Back to log in</button></p>
    </section>
  </main>
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
      {onBack && <button className="x-auth-back" onClick={onBack}><ArrowLeft size={18} /> Keep browsing</button>}
      <span className="x-auth-logo"><Beer size={40} strokeWidth={2.2} /></span>
      <h1>{register ? 'Create your free account' : 'Find your drinking buddy.'}</h1>
      <p className="x-auth-lead">{register ? 'Beer BROS is free to join. No fees, no card — just a few details.' : 'Post where you’re drinking, see where the vibe is, and swipe to meet good company nearby. Free to join.'}</p>
      <form onSubmit={submit} className="x-auth-form">
        {register && <input name="displayName" autoComplete="name" required maxLength={60} placeholder="Name" aria-label="Name" />}
        <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Email" aria-label="Email" />
        <PasswordInput name="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : 1} maxLength={128} placeholder={register ? 'Password (8+ characters)' : 'Password'} aria-label="Password" />
        {register && <>
          <label className="x-auth-dob">Date of birth<span>You must be 18 or older. This isn’t shown publicly.</span><input name="dateOfBirth" type="date" required aria-label="Date of birth" /></label>
          <label className="x-auth-check"><input type="checkbox" name="discoveryEnabled" /> Show me in Discover so people nearby can swipe on me</label>
        </>}
        {error && <p role="alert" className="x-auth-error">{error}</p>}
        <button className="x-auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Sign up' : 'Log in'}</button>
        {!register && <button type="button" className="x-auth-forgot" onClick={() => { setError(''); setResetStep('email') }}>Forgot password?</button>}
      </form>
      <p className="x-auth-switch">{register ? 'Have an account already?' : 'Don’t have an account?'} <button onClick={() => { setError(''); setRegister(!register) }}>{register ? 'Log in' : 'Sign up'}</button></p>
      <p className="x-auth-foot"><ShieldCheck size={14} /> Adults 18+ · Drink responsibly · Your exact location is never shown</p>
    </section>
  </main>
}
