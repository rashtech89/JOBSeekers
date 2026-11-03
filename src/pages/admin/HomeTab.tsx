import { useState } from 'react'
import { Save } from 'lucide-react'
import { useContent } from '../../context/Content'
import { homeSectionNames, type HomeSection } from '../../lib/siteContent'
import { StatusLine, useStatus } from './ui'

export default function HomeTab() {
  const { home, save } = useContent()
  const [items, setItems] = useState<HomeSection[]>(home.map(h => ({ ...h })))
  const s = useStatus()
  const move = (i: number, d: -1 | 1) => setItems(l => { const n = [...l]; const j = i + d; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n })
  const submit = async () => { s.ok('Saving…'); const r = await save('home', { sections: items }); r.ok ? s.ok('Home page saved. Live for all visitors.') : s.fail(r.error || 'Could not save.') }
  return <section className="cv-card">
    <div className="cv-card-title">Home page sections</div>
    <p className="small-note">Show or hide each section and move it up or down. The words inside each section are edited in "Edit page texts".</p>
    {items.map((it, i) => <div className="admin-row" key={it.id}><div className="admin-row-head">
      <label className="admin-checks"><input type="checkbox" checked={it.enabled} onChange={e => setItems(l => l.map(x => x.id === it.id ? { ...x, enabled: e.target.checked } : x))} /> <strong>{homeSectionNames[it.id] ?? it.id}</strong></label>
      <span><button className="icon-btn" onClick={() => move(i, -1)} aria-label="Move up">↑</button> <button className="icon-btn" onClick={() => move(i, 1)} aria-label="Move down">↓</button></span></div></div>)}
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save home page</button>
    <StatusLine status={s.status} />
  </section>
}
