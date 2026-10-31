import { Link, Outlet, useLocation } from 'react-router-dom'
import { BriefcaseBusiness, Globe2, Menu, Moon, Search, Sun, UserRound, X, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { languages, type Lang } from '../i18n/translations'
import { useSiteSettings } from '../context/SiteSettings'
import { useContent } from '../context/Content'
import { useTheme } from '../context/Theme'
import { useAuth } from '../context/Auth'
import { safeHref, type NavItem } from '../lib/siteContent'
import SmartLink from './SmartLink'
import Disclaimer from './Disclaimer'

const KNOWN_GROUPS = ['main', 'explore', 'employers', 'account', 'management', 'support', 'legal']
const SOCIALS = [['facebook', 'Facebook', 'f'], ['instagram', 'Instagram', 'IG'], ['tiktok', 'TikTok', 'TT'], ['youtube', 'YouTube', 'YT'], ['linkedin', 'LinkedIn', 'in'], ['x', 'X', 'X'], ['telegram', 'Telegram', 'TG']] as const

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, setLang, t } = useLang()
  const { settings } = useSiteSettings()
  const { nav, footer } = useContent()
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const location = useLocation()
  const [menuSearch, setMenuSearch] = useState('')

  const labelOf = (it: NavItem) => it.label?.[lang]?.trim() || (it.labelKey ? t(it.labelKey) : it.label?.en?.trim() || it.id)
  const groupOf = (g: string) => (KNOWN_GROUPS.includes(g) ? t(`group.${g}`) : t('group.more'))
  const active = nav.filter(i => i.enabled)
  const headerItems = active.filter(i => i.header)
  const menuItems = active.filter(i => i.menu).map(i => ({ ...i, text: labelOf(i), groupText: groupOf(i.group) }))
  const filtered = menuItems.filter(i => i.text.toLowerCase().includes(menuSearch.toLowerCase()))
  const footerItems = active.filter(i => i.footer)
  const colExplore = footerItems.filter(i => !['support', 'legal'].includes(i.group))
  const colSupport = footerItems.filter(i => i.group === 'support')
  const colLegal = footerItems.filter(i => i.group === 'legal')
  const postItem = active.find(i => i.id === 'post')

  const digits = (s: string) => s.replace(/[^\d]/g, '')
  const hasContact = !!(footer.email || footer.phone || footer.whatsapp || footer.address)
  const socials = SOCIALS.filter(([k]) => safeHref(footer[k]).startsWith('https'))
  const col = (title: string, items: NavItem[]) => items.length > 0 && <div className="footer-links"><h4>{title}</h4>{items.map(i => <SmartLink key={i.id} to={i.to}>{labelOf(i)}</SmartLink>)}</div>

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label={settings.siteName}>
          {settings.logo ? <img className="brand-logo" src={settings.logo} alt="" /> : <span className="brand-mark"><BriefcaseBusiness size={23} /></span>}
          <span>{settings.siteName}<small>{settings.tagline}</small></span>
        </Link>
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={t('drawer.open')}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
          {headerItems.map(i => <SmartLink key={i.id} to={i.to} nav>{labelOf(i)}</SmartLink>)}
        </nav>
        <div className="header-actions">
          <button className="icon-button theme-toggle" onClick={toggle} aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')} title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
          <label className="language-select"><Globe2 size={16}/><select value={lang} onChange={e => setLang(e.target.value as Lang)} aria-label={t('lang.label')}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
          {user ? <Link to="/account" className="login-link"><UserRound size={16}/> {user.displayName?.split(' ')[0] || t('auth.account')}</Link> : <Link to="/login" className="login-link"><UserRound size={16}/> {t('nav.signin')}</Link>}
          {postItem && <SmartLink to={postItem.to} className="button button-primary header-post">{labelOf(postItem)}</SmartLink>}
        </div>
      </header>
      {menuOpen && <div className="menu-backdrop" onClick={() => setMenuOpen(false)}>
        <aside className="page-drawer" onClick={e => e.stopPropagation()}>
          <div className="drawer-heading"><div><span className="eyebrow">{t('drawer.eyebrow')}</span><h2>{t('drawer.title')}</h2></div><button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label={t('drawer.close')}><X size={20}/></button></div>
          <label className="drawer-search"><Search size={17}/><input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder={t('drawer.search')} autoFocus /></label>
          <div className="drawer-results">
            {filtered.map(i => <SmartLink key={i.id} to={i.to} onClick={() => setMenuOpen(false)}><span><small>{i.groupText}</small><strong>{i.text}</strong></span><ChevronRight size={17}/></SmartLink>)}
            {filtered.length === 0 && <p className="drawer-empty">{t('drawer.empty')}</p>}
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
          {col(t('footer.explore'), colExplore)}
          {col(t('footer.support'), colSupport)}
          {col(t('footer.legal'), colLegal)}
          {(hasContact || socials.length > 0 || footer.playStore || footer.appStore) && <div className="footer-links">
            {hasContact && <><h4>{t('footer.contact')}</h4>
              {footer.email && <a href={`mailto:${footer.email}`}>{footer.email}</a>}
              {footer.phone && <a href={`tel:+${digits(footer.phone)}`}>{footer.phone}</a>}
              {footer.whatsapp && <a href={`https://wa.me/${digits(footer.whatsapp)}`} target="_blank" rel="noreferrer noopener">WhatsApp {footer.whatsapp}</a>}
              {footer.address && <span>{footer.address}</span>}</>}
            {socials.length > 0 && <><h4>{t('footer.follow')}</h4><div className="social-row">{socials.map(([k, name, short]) => <a key={k} href={safeHref(footer[k])} target="_blank" rel="noreferrer noopener" aria-label={name} title={name}>{short}</a>)}</div></>}
            {(safeHref(footer.playStore).startsWith('https') || safeHref(footer.appStore).startsWith('https')) && <div className="store-badges">
              {safeHref(footer.playStore).startsWith('https') && <a href={footer.playStore} target="_blank" rel="noreferrer noopener">{t('store.google')}</a>}
              {safeHref(footer.appStore).startsWith('https') && <a href={footer.appStore} target="_blank" rel="noreferrer noopener">{t('store.apple')}</a>}
            </div>}
          </div>}
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.siteName}. {t('footer.rights')}</span><span>{t('footer.built')}</span></div>
      </footer>
    </div>
  )
}
