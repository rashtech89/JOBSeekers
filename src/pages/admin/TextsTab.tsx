import { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { useContent } from '../../context/Content'
import { languages, translations, type Lang } from '../../i18n/translations'
import type { TextOverrides } from '../../lib/siteContent'
import { StatusLine, useStatus } from './ui'

export type TextEntry = { key: string; defaults: Record<Lang, string> }
/** Every built-in website text (or only the ones whose key starts with one of the prefixes). */
export const builtInEntries = (prefixes?: string[]): TextEntry[] =>
  Object.keys(translations.en).sort().filter(k => !prefixes || prefixes.some(p => k.startsWith(p)))
    .map(key => ({ key, defaults: { en: translations.en[key] ?? '', bn: translations.bn[key] ?? translations.en[key] ?? '', ar: translations.ar[key] ?? translations.en[key] ?? '' } }))

export default function TextsTab({ entries, title = 'Edit any website text' }: { entries?: TextEntry[]; title?: string }) {
  const { overrides, save } = useContent()
  const all = useMemo(() => entries ?? builtInEntries(), [entries])
  const [lang, setLang] = useState<Lang>('en')
  const [query, setQuery] = useState('')
  const [edits, setEdits] = useState<TextOverrides>(() => JSON.parse(JSON.stringify(overrides)) as TextOverrides)
  const s = useStatus()
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(e => !q || e.key.toLowerCase().includes(q) || e.defaults[lang].toLowerCase().includes(q)).slice(0, 60)
  }, [all, query, lang])
  const setText = (key: string, value: string) => setEdits(e => ({ ...e, [key]: { ...e[key], [lang]: value } }))

  const submit = async () => {
    const clean: TextOverrides = {}
    for (const [k, v] of Object.entries(edits) as [string, Partial<Record<Lang, string>>][]) {
      const entry: Partial<Record<Lang, string>> = {}
      for (const l of ['en', 'bn', 'ar'] as const) { const t = (v[l] ?? '').trim(); if (t) entry[l] = t.slice(0, 600) }
      if (Object.keys(entry).length) clean[k] = entry
    }
    s.ok('Saving…'); const r = await save('texts', { overrides: clean }); r.ok ? s.ok('Saved. Live for all visitors.') : s.fail(r.error || 'Could not save.')
  }

  return <section className="cv-card">
    <div className="cv-card-title">{title}</div>
    <p className="small-note">Type your own text under any line and press Save. Leave it empty to use the original. Works for every language.</p>
    <div className="cv-row">
      <label className="cv-field"><span>Language</span><select value={lang} onChange={e => setLang(e.target.value as Lang)}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
      <label className="cv-field"><span>Search</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a word" /></label>
    </div>
    {rows.map(e => <div className="admin-row" key={e.key}>
      <small>{e.key}</small><div className="small-note">{e.defaults[lang]}</div>
      <input value={edits[e.key]?.[lang] ?? ''} onChange={ev => setText(e.key, ev.target.value)} placeholder="Your own text (optional)" />
    </div>)}
    {rows.length === 60 && <p className="small-note">Showing the first 60 matches. Search to narrow the list.</p>}
    {rows.length === 0 && <p className="small-note">No texts found.</p>}
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save texts</button>
    <StatusLine status={s.status} />
  </section>
}
