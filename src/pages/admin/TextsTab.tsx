import { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { useContent } from '../../context/Content'
import { languages, translations, type Lang } from '../../i18n/translations'
import type { TextOverrides } from '../../lib/siteContent'
import { StatusLine, useStatus } from './ui'

const ALL_KEYS = Object.keys(translations.en).sort()

export default function TextsTab() {
  const { overrides, save } = useContent()
  const [lang, setLang] = useState<Lang>('en')
  const [query, setQuery] = useState('')
  const [edits, setEdits] = useState<TextOverrides>(() => JSON.parse(JSON.stringify(overrides)) as TextOverrides)
  const s = useStatus()
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_KEYS.filter(k => !q || k.toLowerCase().includes(q) || (translations[lang][k] ?? translations.en[k] ?? '').toLowerCase().includes(q)).slice(0, 40)
  }, [query, lang])
  const setText = (key: string, value: string) => setEdits(e => ({ ...e, [key]: { ...e[key], [lang]: value } }))

  const submit = async () => {
    const clean: TextOverrides = {}
    for (const [k, v] of Object.entries(edits) as [string, Partial<Record<Lang, string>>][]) {
      const entry: Partial<Record<Lang, string>> = {}
      for (const l of ['en', 'bn', 'ar'] as const) { const t = (v[l] ?? '').trim(); if (t) entry[l] = t.slice(0, 600) }
      if (Object.keys(entry).length) clean[k] = entry
    }
    s.ok('Saving…'); const r = await save('texts', { overrides: clean }); r.ok ? s.ok('Texts saved. They are live for all visitors.') : s.fail(r.error || 'Could not save.')
  }

  return <section className="cv-card">
    <div className="cv-card-title">Edit any website text</div>
    <p className="small-note">Search a word, type your own text, and press Save. Leave the box empty to use the original text. Works in every language.</p>
    <div className="cv-row">
      <label className="cv-field"><span>Language</span><select value={lang} onChange={e => setLang(e.target.value as Lang)}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
      <label className="cv-field"><span>Search</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Find jobs, footer, login" /></label>
    </div>
    {rows.map(k => <div className="admin-row" key={k}>
      <small>{k}</small>
      <div className="small-note">{translations[lang][k] ?? translations.en[k]}</div>
      <input value={edits[k]?.[lang] ?? ''} onChange={e => setText(k, e.target.value)} placeholder="Your own text (optional)" />
    </div>)}
    {rows.length === 40 && <p className="small-note">Showing the first 40 matches. Search to narrow the list.</p>}
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save texts</button>
    <StatusLine status={s.status} />
  </section>
}
