import { Navigate, useNavigate } from 'react-router-dom'
import AuthForm, { type AuthMode } from '../components/AuthForm'
import { useAuth } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, loading, configured } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  if (!configured) return <div className="content-page"><div className="empty-state"><p>{t('auth.notConfigured')}</p></div></div>
  if (!loading && user) return <Navigate to="/account" replace />
  return <div className="content-page page-enter"><AuthForm initialMode={mode} onDone={() => navigate('/account')} /></div>
}
