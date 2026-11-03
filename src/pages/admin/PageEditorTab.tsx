import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cvLabels } from '../../lib/cv'
import { builtInEntries, type TextEntry } from './TextsTab'
import TextsTab from './TextsTab'

type PageDef = { id: string; name: string; path: string; entries: () => TextEntry[]; note?: string }
const cvEntries = (): TextEntry[] => (Object.keys(cvLabels.en) as (keyof typeof cvLabels.en)[]).map(k => ({ key: `cv.${k}`, defaults: { en: cvLabels.en[k], bn: cvLabels.bn[k], ar: cvLabels.ar[k] } }))

const PAGES: PageDef[] = [
  { id: 'home', name: 'Home', path: '/', entries: () => builtInEntries(['home.', 'tab.']), note: 'To hide, show or reorder Home sections use the "Home sections" tab.' },
  { id: 'jobs', name: 'Find Jobs and job details', path: '/jobs', entries: () => builtInEntries(['jobs.', 'job.', 'btn.', 'tag.']) },
  { id: 'cv', name: 'CV Builder', path: '/cv-builder', entries: cvEntries },
  { id: 'auth', name: 'Sign in, register and account', path: '/login', entries: () => builtInEntries(['auth.', 'acct.']) },
  { id: 'global', name: 'Menu, footer and general', path: '/', entries: () => builtInEntries(['nav.', 'group.', 'drawer.', 'footer.', 'lang.', 'theme.', 'disclaimer.', 'store.', 'page.', 'nf.']) },
]

/** Click a page, then edit every text on it. Page contents (Privacy, Terms, ...) are in the "Custom pages" tab. */
export default function PageEditorTab() {
  const [id, setId] = useState(PAGES[0].id)
  const page = PAGES.find(p => p.id === id) ?? PAGES[0]
  const entries = useMemo(() => page.entries(), [page])
  return <div className="admin-shell">
    <section className="cv-card">
      <div className="cv-card-title">Choose a page to edit</div>
      <div className="admin-tabs">{PAGES.map(p => <button key={p.id} className={id === p.id ? 'tab-btn active' : 'tab-btn'} onClick={() => setId(p.id)}>{p.name}</button>)}</div>
      <p className="small-note">Open this page on the website: <Link to={page.path}>{page.path}</Link>. {page.note}</p>
    </section>
    <TextsTab key={page.id} entries={entries} title={`Texts on: ${page.name}`} />
  </div>
}
