import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'

export default function Account() {
  const { user, loading, logout } = useAuth()
  const { t } = useLang()
  if (loading) return <div className="content-page"><p>{t('auth.loading')}</p></div>
  if (!user) return <Navigate to="/login" replace />
  return <div className="content-page page-enter"><div className="auth-card">
    <h1>{t('acct.title')}</h1>
    <p><strong>{user.displayName || '—'}</strong></p>
    <p>{user.email}</p>
    <p className={user.emailVerified ? 'small-note' : 'notice'}>{user.emailVerified ? t('acct.verified') : t('acct.notVerified')}</p>
    <p className="small-note">{t('acct.soon')}</p>
    <Link className="button button-outline full-button" to="/cv-builder">{t('nav.cv')}</Link>
    <button className="button button-primary full-button" onClick={() => { void logout() }}>{t('auth.logout')}</button>
  </div></div>
}
