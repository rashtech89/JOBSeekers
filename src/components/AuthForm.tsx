import { useState, type FormEvent } from 'react'
import { useAuth, type AccountType } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'

export type AuthMode = 'login' | 'register' | 'reset'

function errorKey(code?: string): string {
  switch (code) {
    case 'auth/invalid-credential': case 'auth/wrong-password': case 'auth/user-not-found': return 'auth.err.credentials'
    case 'auth/email-already-in-use': return 'auth.err.exists'
    case 'auth/weak-password': return 'auth.err.weak'
    case 'auth/invalid-email': return 'auth.err.email'
    case 'auth/too-many-requests': return 'auth.err.many'
    case 'auth/network-request-failed': return 'auth.err.network'
    case 'auth/operation-not-allowed': return 'auth.err.google'
    case 'auth/popup-blocked': return 'auth.err.popup'
    case 'auth/popup-closed-by-user': case 'auth/cancelled-popup-request': return ''
    case 'auth/not-configured': return 'auth.notConfigured'
    default: return 'auth.err.generic'
  }
}

export default function AuthForm({ initialMode = 'login', onDone }: { initialMode?: AuthMode; onDone?: () => void }) {
  const { t } = useLang()
  const { login, register, resetPassword, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [type, setType] = useState<AccountType>('seeker')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setInfo('')
    if (mode === 'register' && password.length < 8) { setError(t('auth.err.weak')); return }
    setBusy(true)
    try {
      if (mode === 'login') { await login(email.trim(), password); onDone?.() }
      else if (mode === 'register') { await register(email.trim(), password, name.trim(), type); setInfo(t('auth.verifySent')); onDone?.() }
      else { await resetPassword(email.trim()); setInfo(t('auth.reset.sent')) }
    } catch (err) {
      const key = errorKey((err as { code?: string }).code)
      setError(key ? t(key) : '')
    } finally { setBusy(false) }
  }

  async function google() {
    setError(''); setInfo(''); setBusy(true)
    try { await loginWithGoogle(); onDone?.() }
    catch (err) { const key = errorKey((err as { code?: string }).code); setError(key ? t(key) : '') }
    finally { setBusy(false) }
  }

  const title = mode === 'login' ? t('auth.login.title') : mode === 'register' ? t('auth.register.title') : t('auth.reset.title')
  return <form className="auth-card" onSubmit={submit} noValidate={false}>
    <h1>{title}</h1>
    <p className="auth-sub">{mode === 'login' ? t('auth.login.sub') : mode === 'register' ? t('auth.register.sub') : t('auth.reset.sub')}</p>
    {mode === 'register' && <>
      <label className="cv-field"><span>{t('auth.name')}</span><input required maxLength={80} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
      <label className="cv-field"><span>{t('auth.type')}</span>
        <select value={type} onChange={e => setType(e.target.value as AccountType)}>
          <option value="seeker">{t('auth.type.seeker')}</option><option value="employer">{t('auth.type.employer')}</option><option value="hr">{t('auth.type.hr')}</option>
        </select></label>
    </>}
    <label className="cv-field"><span>{t('auth.email')}</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
    {mode !== 'reset' && <label className="cv-field"><span>{t('auth.password')}</span>
      <input required type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      {mode === 'register' && <small>{t('auth.password.hint')}</small>}</label>}
    {error && <p className="notice auth-error" role="alert">{error}</p>}
    {info && <p className="notice" role="status">{info}</p>}
    <button className="button button-primary full-button" type="submit" disabled={busy}>
      {busy ? t('auth.loading') : mode === 'login' ? t('auth.submit.login') : mode === 'register' ? t('auth.submit.register') : t('auth.reset.submit')}
    </button>
    {mode !== 'reset' && <><div className="auth-divider">{t('auth.or')}</div><button type="button" className="button button-outline full-button" onClick={google} disabled={busy}>{t('auth.google')}</button></>}
    <div className="auth-links">
      {mode === 'login' && <><button type="button" onClick={() => setMode('reset')}>{t('auth.forgot')}</button><button type="button" onClick={() => setMode('register')}>{t('auth.noAccount')}</button></>}
      {mode === 'register' && <button type="button" onClick={() => setMode('login')}>{t('auth.haveAccount')}</button>}
      {mode === 'reset' && <button type="button" onClick={() => setMode('login')}>{t('auth.back')}</button>}
    </div>
  </form>
}
