import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BriefcaseBusiness, Globe2, Menu, Moon, Search, Sun, UserRound, X, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { languages, type Lang } from '../i18n/translations'
import { useSiteSettings } from '../context/SiteSettings'
import { useTheme } from '../context/Theme'
import { useAuth } from '../context/Auth'
import Disclaimer from './Disclaimer'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, setLang, t } = useLang()
  const { settings } = useSiteSettings()
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const location = useLocation()
  const [menuSearch, setMenuSearch] = useState('')
  const menuItems = [
    { label: t('nav.home'), to: '/', group: t('group.main') },
    { label: t('nav.jobs'), to: '/jobs', group: t('group.main') },
    { label: t('nav.cv'), to: '/cv-builder', group: t('group.main') },
    { label: t('nav.companies'), to: '/companies', group: t('group.explore') },
    { label: t('nav.employers'), to: '/employer', group: t('group.employers') },
    { label: t('nav.post'), to: '/employer/upload', group: t('group.employers') },
    { label: t('nav.login'), to: '/login', group: t('group.account') },
    { label: t('nav.register'), to: '/register', group: t('group.account') },
    { label: t('nav.contact'), to: '/contact', group: t('group.support') },
    { label: t('nav.help'), to: '/help', group: t('group.support') },
    { label: t('nav.safety'), to: '/safety', group: t('group.support') },
    { label: t('nav.privacy'), to: '/privacy', group: t('group.legal') },
    { label: t('nav.terms'), to: '/terms', group: t('group.legal') },
    { label: t('nav.cookies'), to: '/cookies', group: t('group.legal') },
  ]
  const filteredMenuItems = menuItems.filter(item => item.label.toLowerCase().includes(menuSearch.toLowerCase()))
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label={settings.siteName}>
          {settings.logo ? <img className="brand-logo" src={settings.logo} alt="" /> : <span className="brand-mark"><BriefcaseBusiness size={23} /></span>}
          <span>{settings.siteName}<small>{settings.tagline}</small></span>
        </Link>
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={t('drawer.open')}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
          <NavLink to="/jobs">{t('nav.jobs')}</NavLink>
          <NavLink to="/cv-builder">{t('nav.cv')}</NavLink><NavLink to="/companies">{t('nav.companies')}</NavLink>
          <NavLink to="/employer">{t('nav.employers')}</NavLink>
        </nav>
        <div className="header-actions">
          <button className="icon-button theme-toggle" onClick={toggle} aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')} title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
          <label className="language-select"><Globe2 size={16}/><select value={lang} onChange={e => setLang(e.target.value as Lang)} aria-label={t('lang.label')}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
          {user ? <Link to="/account" className="login-link"><UserRound size={16}/> {user.displayName?.split(' ')[0] || t('auth.account')}</Link> : <Link to="/login" className="login-link"><UserRound size={16}/> {t('nav.signin')}</Link>}
          <Link to="/employer/upload" className="button button-primary header-post">{t('nav.post')}</Link>
        </div>
      </header>
      {menuOpen && <div className="menu-backdrop" onClick={() => setMenuOpen(false)}>
        <aside className="page-drawer" onClick={e => e.stopPropagation()}>
          <div className="drawer-heading"><div><span className="eyebrow">{t('drawer.eyebrow')}</span><h2>{t('drawer.title')}</h2></div><button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label={t('drawer.close')}><X size={20}/></button></div>
          <label className="drawer-search"><Search size={17}/><input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder={t('drawer.search')} autoFocus /></label>
          <div className="drawer-results">
            {filteredMenuItems.map(item => <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}><span><small>{item.group}</small><strong>{item.label}</strong></span><ChevronRight size={17}/></Link>)}
            {filteredMenuItems.length === 0 && <p className="drawer-empty">{t('drawer.empty')}</p>}
          </div>
        </aside>
      </div>}
      <main><div key={location.pathname} className="route-transition"><Outlet /></div></main>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="brand brand-light">{settings.logo ? <img className="brand-logo" src={settings.logo} alt="" /> : <span className="brand-mark"><BriefcaseBusiness size={22}/></span>}<span>{settings.siteName}<small>{settings.tagline}</small></span></Link>
            <p>{settings.footerDescription}</p>
            <Disclaimer compact />
          </div>
          <div><h4>{t('footer.explore')}</h4><Link to="/jobs">{t('nav.jobs')}</Link><Link to="/cv-builder">{t('nav.cv')}</Link><Link to="/companies">{t('nav.companies')}</Link><Link to="/employer/upload">{t('nav.post')}</Link></div>
          <div><h4>{t('footer.support')}</h4><Link to="/contact">{t('nav.contact')}</Link><Link to="/help">{t('nav.help')}</Link><Link to="/safety">{t('nav.safety')}</Link></div>
          <div><h4>{t('footer.legal')}</h4><Link to="/privacy">{t('nav.privacy')}</Link><Link to="/terms">{t('nav.terms')}</Link><Link to="/cookies">{t('nav.cookies')}</Link></div>
          <div><h4>{t('footer.follow')}</h4><a href="#" aria-label="Facebook">Facebook</a><a href="#" aria-label="Instagram">Instagram</a><a href="#" aria-label="TikTok">TikTok</a><a href="#" aria-label="LinkedIn">LinkedIn</a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.siteName}. {t('footer.rights')}</span><span>{t('footer.built')}</span></div>
      </footer>
    </div>
  )
}
