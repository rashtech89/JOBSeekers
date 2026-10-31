import { useAuth } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'
import AuthForm from '../components/AuthForm'
import Admin from './Admin'

/** The Admin Control Center only renders for a signed-in account that has an admins/<uid> document. */
export default function AdminGate() {
  const { user, isAdmin, loading, configured, logout } = useAuth()
  const { t } = useLang()
  if (!configured) return <div className="content-page"><div className="empty-state"><p>{t('auth.notConfigured')}</p></div></div>
  if (loading) return <div className="content-page"><p>{t('auth.loading')}</p></div>
  if (!user) return <div className="content-page page-enter"><AuthForm initialMode="login" /></div>
  if (!isAdmin) return <div className="content-page page-enter"><div className="auth-card">
    <h1>{t('auth.denied.title')}</h1><p>{t('auth.denied.desc')}</p>
    <button className="button button-outline full-button" onClick={() => { void logout() }}>{t('auth.logout')}</button>
  </div></div>
  return <Admin />
}
