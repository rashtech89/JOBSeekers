import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { Save } from 'lucide-react'
import { db } from '../../lib/firebase'
import { languages, type Lang } from '../../i18n/translations'
import { AField, StatusLine, useStatus } from './ui'

type L3 = Record<Lang, string>
const empty = (): L3 => ({ en: '', bn: '', ar: '' })
const BUILT_IN = ['privacy', 'terms', 'cookies', 'contact', 'help', 'safety', 'companies', 'employer']
const SLUG = /^[a-z0-9-]{1,60}$/

export default function PagesTab() {
  const [slugs, setSlugs] = useState<string[]>(BUILT_IN)
  const [slug, setSlug] = useState(BUILT_IN[0])
  const [newSlug, setNewSlug] = useState('')
  const [title, setTitle] = useState<L3>(empty())
  const [body, setBody] = useState<L3>(empty())
  const [visible, setVisible] = useState(true)
  const [exists, setExists] = useState(false)
  const s = useStatus()

  useEffect(() => {
    if (!db) return
    getDocs(collection(db, 'pages')).then(snap => setSlugs(prev => Array.from(new Set([...prev, ...snap.docs.map(d => d.id)])))).catch(() => { /* list is optional */ })
  }, [])

  useEffect(() => {
    if (!db) return
    let cancelled = false
    getDoc(doc(db, 'pages', slug)).then(snap => {
      if (cancelled) return
      const d = snap.data() as { title?: Partial<L3>; body?: Partial<L3>; visible?: boolean } | undefined
      setExists(snap.exists()); setTitle({ ...empty(), ...d?.title }); setBody({ ...empty(), ...d?.body }); setVisible(d?.visible !== false)
    }).catch(() => s.fail('Could not load this page.'))
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const link = BUILT_IN.includes(slug) ? `/${slug}` : `/p/${slug}`
  const addSlug = () => {
    const v = newSlug.trim().toLowerCase()
    if (!SLUG.test(v)) return s.fail('Use only small letters, numbers and hyphens, for example: about-us')
    setSlugs(l => (l.includes(v) ? l : [...l, v])); setSlug(v); setNewSlug(''); s.clear()
  }
  const submit = async () => {
    if (!db) return s.fail('Firebase is not configured.')
    if (!SLUG.test(slug)) return s.fail('This page address is not valid.')
    s.ok('Saving…')
    try {
      await setDoc(doc(db, 'pages', slug), { title, body, visible, updatedAt: serverTimestamp() })
      setExists(true); s.ok(`Page saved. Address: ${link}`)
    } catch (e) { s.fail((e as { code?: string }).code === 'permission-denied' ? 'Permission denied. Publish the latest firestore.rules and check your admin account.' : 'Could not save.') }
  }
  const remove = async () => {
    if (!db || !exists || !window.confirm('Delete this page content? The built-in page text will be shown again.')) return
    try { await deleteDoc(doc(db, 'pages', slug)); setExists(false); setTitle(empty()); setBody(empty()); s.ok('Deleted.') } catch { s.fail('Could not delete.') }
  }

  return <section className="cv-card">
    <div className="cv-card-title">Pages</div>
    <p className="small-note">Write the content of Privacy, Terms, Contact and any new page. Add new pages below, then link them from the Navigation tab using the address shown after saving.</p>
    <div className="cv-row">
      <label className="cv-field"><span>Page</span><select value={slug} onChange={e => { setSlug(e.target.value); s.clear() }}>{slugs.map(x => <option key={x} value={x}>{x}</option>)}</select></label>
      <AField label="New page address" value={newSlug} onChange={setNewSlug} placeholder="about-us" hint="Small letters, numbers, hyphens" />
    </div>
    <button className="button button-outline" onClick={addSlug}>Add this page</button>
    <p className="small-note">Public address: <strong>{link}</strong> {exists ? '(has custom content)' : '(using the built-in text)'}</p>
    {languages.map(l => <div className="admin-row" key={l.code}>
      <strong>{l.label}</strong>
      <AField label="Title" value={title[l.code]} onChange={v => setTitle(t => ({ ...t, [l.code]: v }))} />
      <AField label="Content" area value={body[l.code]} onChange={v => setBody(b => ({ ...b, [l.code]: v }))} hint="Leave a blank line between paragraphs." />
    </div>)}
    <label className="admin-checks"><span><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Visible to visitors</span></label>
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save page</button>
    {exists && <button className="button button-outline" onClick={() => void remove()}>Delete page content</button>}
    <StatusLine status={s.status} />
  </section>
}
