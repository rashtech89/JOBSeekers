import { useEffect, useState } from 'react'
import BrandingTab from './admin/BrandingTab'
import ThemeTab from './admin/ThemeTab'
import NavigationTab from './admin/NavigationTab'
import FooterTab from './admin/FooterTab'
import TextsTab from './admin/TextsTab'
import PagesTab from './admin/PagesTab'

const TABS = [
  ['branding', 'Branding'], ['themes', 'Themes'], ['navigation', 'Menu & links'], ['footer', 'Footer & social'], ['texts', 'Edit texts'], ['pages', 'Pages'],
] as const
type Tab = (typeof TABS)[number][0]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('branding')
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'; meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => { meta.remove() }
  }, [])

  return <div className="content-page page-enter"><div className="admin-shell">
    <div className="page-heading"><p className="eyebrow">PRIVATE MANAGEMENT WORKSPACE</p><h1>Admin Control Center</h1><p>Everything you save here goes live for all visitors.</p></div>
    <div className="admin-tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'branding' && <BrandingTab />}
    {tab === 'themes' && <ThemeTab />}
    {tab === 'navigation' && <NavigationTab />}
    {tab === 'footer' && <FooterTab />}
    {tab === 'texts' && <TextsTab />}
    {tab === 'pages' && <PagesTab />}
    <section className="cv-card"><div className="cv-card-title">Coming in the next steps</div>
      <p className="small-note">Home-page sections, Users and Roles, Jobs and Bulk upload, Languages and SEO settings.</p></section>
  </div></div>
}
