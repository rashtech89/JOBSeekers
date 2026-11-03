import { useEffect, useState } from 'react'
import DashboardTab from './admin/DashboardTab'
import PageEditorTab from './admin/PageEditorTab'
import HomeTab from './admin/HomeTab'
import JobsTab from './admin/JobsTab'
import BulkTab from './admin/BulkTab'
import ModerationTab from './admin/ModerationTab'
import UsersTab from './admin/UsersTab'
import BrandingTab from './admin/BrandingTab'
import ThemeTab from './admin/ThemeTab'
import NavigationTab from './admin/NavigationTab'
import FooterTab from './admin/FooterTab'
import TextsTab from './admin/TextsTab'
import PagesTab from './admin/PagesTab'

const TABS = [
  ['dashboard', 'Dashboard'], ['pageeditor', 'Edit page texts'], ['home', 'Home sections'], ['jobs', 'Jobs'], ['bulk', 'Bulk upload'],
  ['moderation', 'Reports & feed'], ['users', 'Members'], ['branding', 'Branding'], ['themes', 'Themes'], ['navigation', 'Menu & links'],
  ['footer', 'Footer & social'], ['texts', 'All texts'], ['pages', 'Custom pages'],
] as const
type Tab = (typeof TABS)[number][0]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('dashboard')
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'; meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => { meta.remove() }
  }, [])
  const go = (id: string) => { if (TABS.some(t => t[0] === id)) setTab(id as Tab); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <div className="content-page page-enter"><div className="admin-shell">
    <div className="page-heading"><p className="eyebrow">PRIVATE MANAGEMENT WORKSPACE</p><h1>Admin Control Center</h1><p>Everything you save here goes live for all visitors.</p></div>
    <div className="admin-tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'dashboard' && <DashboardTab go={go} />}
    {tab === 'pageeditor' && <PageEditorTab />}
    {tab === 'home' && <HomeTab />}
    {tab === 'jobs' && <JobsTab />}
    {tab === 'bulk' && <BulkTab />}
    {tab === 'moderation' && <ModerationTab />}
    {tab === 'users' && <UsersTab />}
    {tab === 'branding' && <BrandingTab />}
    {tab === 'themes' && <ThemeTab />}
    {tab === 'navigation' && <NavigationTab />}
    {tab === 'footer' && <FooterTab />}
    {tab === 'texts' && <TextsTab />}
    {tab === 'pages' && <PagesTab />}
  </div></div>
}
