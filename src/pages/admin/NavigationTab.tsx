import { useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { useContent } from '../../context/Content'
import { translations, languages } from '../../i18n/translations'
import { defaultNav, safeHref, type NavItem } from '../../lib/siteContent'
import { AField, StatusLine, useStatus } from './ui'

const uid = () => Math.random().toString(36).slice(2, 8)

export default function NavigationTab() {
  const { nav, save } = useContent()
  const [items, setItems] = useState<NavItem[]>(() => nav.map(i => ({ ...i, label: { ...i.label } })))
  const s = useStatus()
  const patch = (id: string, p: Partial<NavItem>) => setItems(list => list.map(i => i.id === id ? { ...i, ...p } : i))
  const move = (idx: number, dir: -1 | 1) => setItems(list => { const next = [...list]; const j = idx + dir; if (j < 0 || j >= next.length) return list; [next[idx], next[j]] = [next[j], next[idx]]; return next })
  const isDefault = (id: string) => defaultNav.some(d => d.id === id)

  const submit = async () => {
    for (const i of items) {
      if (!safeHref(i.to)) return s.fail(`The link "${i.to}" is not allowed. Use a path like /jobs or a full https:// link.`)
      if (!isDefault(i.id) && !(i.label?.en || i.label?.bn || i.label?.ar)) return s.fail('Every new menu item needs a name in at least one language.')
    }
    const clean = items.map(i => ({
      id: i.id, to: i.to.trim(), group: i.group, enabled: i.enabled, header: i.header, menu: i.menu, footer: i.footer,
      label: { en: i.label?.en ?? '', bn: i.label?.bn ?? '', ar: i.label?.ar ?? '' }, ...(i.labelKey ? { labelKey: i.labelKey } : {}),
    }))
    s.ok('Saving…'); const r = await save('navigation', { items: clean }); r.ok ? s.ok('Menu saved. It is live for all visitors.') : s.fail(r.error || 'Could not save.')
  }

  return <section className="cv-card">
    <div className="cv-card-title">Navigation and menu links</div>
    <p className="small-note">Leave a name empty to use the built-in translation. Header = top bar. Menu = the search menu (three-line button). Footer = bottom links.</p>
    {items.map((it, idx) => <div className="admin-row" key={it.id}>
      <div className="admin-row-head"><strong>{it.label?.en || (it.labelKey ? translations.en[it.labelKey] : it.id)}</strong>
        <span><button className="icon-btn" onClick={() => move(idx, -1)} aria-label="Move up">↑</button> <button className="icon-btn" onClick={() => move(idx, 1)} aria-label="Move down">↓</button>
          {!isDefault(it.id) && <> <button className="icon-btn" onClick={() => setItems(l => l.filter(x => x.id !== it.id))}>Delete</button></>}</span></div>
      <div className="cv-row">
        {languages.map(l => <AField key={l.code} label={`Name (${l.label})`} value={it.label?.[l.code] ?? ''} placeholder={it.labelKey ? translations[l.code][it.labelKey] : ''}
          onChange={v => patch(it.id, { label: { ...it.label, [l.code]: v } })} />)}
      </div>
      <AField label="Link" value={it.to} onChange={v => patch(it.id, { to: v })} hint="Example: /jobs or /p/about or https://example.com" />
      <div className="admin-checks">
        <label><input type="checkbox" checked={it.enabled} onChange={e => patch(it.id, { enabled: e.target.checked })} /> Show</label>
        <label><input type="checkbox" checked={it.header} onChange={e => patch(it.id, { header: e.target.checked })} /> Header</label>
        <label><input type="checkbox" checked={it.menu} onChange={e => patch(it.id, { menu: e.target.checked })} /> Menu</label>
        <label><input type="checkbox" checked={it.footer} onChange={e => patch(it.id, { footer: e.target.checked })} /> Footer</label>
      </div>
    </div>)}
    <button className="button button-outline" onClick={() => setItems(l => [...l, { id: `c-${uid()}`, to: '/', group: 'more', label: { en: '', bn: '', ar: '' }, enabled: true, header: false, menu: true, footer: false }])}><Plus size={16}/> Add menu item</button>
    <button className="button button-outline" onClick={() => setItems(defaultNav.map(i => ({ ...i, label: {} })))}>Reset to defaults (not saved until you press Save)</button>
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save menu</button>
    <StatusLine status={s.status} />
  </section>
}
