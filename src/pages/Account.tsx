import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'

export default function Account() {
  const { user, loading, logout, resendVerification, refreshUser } = useAuth()
  const { t } = useLang()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (loading) return <div className="content-page"><p>{t('auth.loading')}</p></div>
  if (!user) return <Navigate to="/login" replace />

  async function resend() {
    setBusy(true); setMsg('')
    try { await resendVerification(); setMsg(t('auth.resent')) } catch { setMsg(t('auth.err.many')) } finally { setBusy(false) }
  }
  async function check() {
    setBusy(true); setMsg('')
    try { await refreshUser() } catch { setMsg(t('auth.err.network')); setBusy(false); return }
    setBusy(false)
    if (!user?.emailVerified) setMsg(t('auth.stillNot'))
  }

  return <div className="content-page page-enter"><div className="auth-card">
    <h1>{t('acct.title')}</h1>
    <p><strong>{user.displayName || '—'}</strong></p>
    <p>{user.email}</p>
    {user.emailVerified
      ? <p className="small-note">{t('acct.verified')}</p>
      : <div className="verify-box">
          <p className="notice">{t('acct.notVerified')}</p>
          <p className="notice" role="alert">{t('auth.spamAlert')}</p>
          <button className="button button-outline full-button" onClick={resend} disabled={busy}>{t('auth.resend')}</button>
          <button className="button button-outline full-button" onClick={check} disabled={busy}>{t('auth.iVerified')}</button>
          {msg && <p className="small-note" role="status">{msg}</p>}
        </div>}
    <p className="small-note">{t('acct.soon')}</p>
    <Link className="button button-primary full-button" to="/">{t('acct.goHome')}</Link>
    <Link className="button button-outline full-button" to="/jobs">{t('acct.explore')}</Link>
    <button className="button button-outline full-button" onClick={() => { void logout() }}>{t('auth.logout')}</button>
  </div></div>
}
