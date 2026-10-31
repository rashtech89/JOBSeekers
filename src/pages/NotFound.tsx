import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'

export default function NotFound() {
  const { t } = useLang()
  return <div className="content-page page-enter"><div className="empty-state">
    <h1>404</h1><h2>{t('nf.title')}</h2><p>{t('nf.desc')}</p>
    <div className="generic-actions"><Link className="button button-primary" to="/">{t('nf.home')}</Link><Link className="button button-outline" to="/jobs">{t('nf.jobs')}</Link></div>
  </div></div>
}
