import { useCallback, useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { Plus, Save } from 'lucide-react'
import { db } from '../../lib/firebase'
import { compressImage } from '../../lib/images'
import { loadPoster } from '../../lib/posters'
import { detectPosterContacts, stopOcr } from '../../lib/ocr'
import { countryOptions, isCountryCode } from '../../lib/countries'
import { useLang } from '../../i18n/LanguageContext'
import { useJobs } from '../../context/Jobs'
import { AField, StatusLine, useStatus } from './ui'

type Raw = Record<string, unknown>
type Row = { id: string; title: string; company: string; countryCode: string; status: string; raw: Raw }
type Form = {
  id: string | null; company: string; countryCode: string; city: string; title: string; category: string; requirements: string; howToApply: string
  phone: string; dialCode: string; whatsapp: boolean; calls: boolean; email: string; mapsUrl: string; applyUrl: string; status: string
  hasPoster: boolean; posterId: string; newPoster: string; raw: Raw
}
const blank = (): Form => ({ id: null, company: '', countryCode: '', city: '', title: '', category: 'General', requirements: '', howToApply: '', phone: '', dialCode: '', whatsapp: true, calls: false, email: '', mapsUrl: '', applyUrl: '', status: 'published', hasPoster: false, posterId: '', newPoster: '', raw: {} })
const s = (v: unknown) => (typeof v === 'string' ? v : '')
const httpsOnly = (u: string) => !u.trim() || /^https:\/\/\S+$/i.test(u.trim())

function toForm(r: Row): Form {
  const d = r.raw
  const pos = (Array.isArray(d.positions) ? d.positions[0] : null) as Raw | null
  const ph = (Array.isArray(d.phones) ? d.phones[0] : null) as Raw | null
  return {
    id: r.id, company: s(d.company), countryCode: s(d.countryCode), city: s(d.city), title: s(pos?.title), category: s(pos?.category) || 'General',
    requirements: (Array.isArray(pos?.requirements) ? (pos?.requirements as unknown[]) : []).filter((x): x is string => typeof x === 'string').join('\n'),
    howToApply: s(d.howToApply), phone: s(ph?.number), dialCode: s(ph?.dialCode), whatsapp: ph ? ph.whatsapp === true : true, calls: ph?.calls === true,
    email: (Array.isArray(d.emails) ? s(d.emails[0]) : ''), mapsUrl: s(d.mapsUrl), applyUrl: s(d.applyUrl), status: s(d.status) || 'published',
    hasPoster: d.hasPoster === true, posterId: s(d.posterId), newPoster: '', raw: d,
  }
}

export default function JobsTab() {
  const { lang } = useLang()
  const { refresh } = useJobs()
  const [rows, setRows] = useState<Row[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const st = useStatus()
  const [scanning, setScanning] = useState('')
  const load = useCallback(async () => {
    if (!db) return
    try {
      const snap = await getDocs(query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), limit(60)))
      setRows(snap.docs.map(d => {
        const x = d.data() as Raw; const p = (Array.isArray(x.positions) ? x.positions[0] : null) as Raw | null
        return { id: d.id, title: s(p?.title) || 'Job', company: s(x.company), countryCode: s(x.countryCode), status: s(x.status), raw: x }
      }))
    } catch { st.fail('Could not load jobs. Publish the latest firestore.rules and check your admin account.') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { void load() }, [load])
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => (f ? { ...f, [k]: v } : f))

  // Reads phone numbers, emails and QR links from the poster picture. It only fills EMPTY boxes; the admin must check the result.
  const scanPoster = async () => {
    if (!form) return
    setScanning('Starting…'); st.clear()
    try {
      const img = form.newPoster || await loadPoster(form.posterId || form.id || '')
      if (!img) { st.fail('Add a poster picture first.'); return }
      const found = await detectPosterContacts(img, form.countryCode, setScanning)
      const first = found.phones[0]
      setForm(f => f ? {
        ...f, phone: f.phone || first?.number || '', dialCode: f.dialCode || first?.dialCode || '',
        whatsapp: f.phone ? f.whatsapp : first ? first.whatsapp : f.whatsapp, calls: f.phone ? f.calls : first ? first.calls : f.calls,
        email: f.email || found.emails[0] || '', mapsUrl: f.mapsUrl || found.mapsUrl, applyUrl: f.applyUrl || found.applyUrl,
      } : f)
      const parts = [
        found.phones.length ? `phone: ${found.phones.map(p => `${p.dialCode ? `+${p.dialCode} ` : ''}${p.number}`).join(', ')}` : '',
        found.emails.length ? `email: ${found.emails.join(', ')}` : '', found.applyUrl ? 'apply link' : '', found.mapsUrl ? 'map link' : '',
      ].filter(Boolean)
      parts.length ? st.ok(`Found ${parts.join(' · ')}. Please compare with the poster, then save.`) : st.fail('No phone, email or QR link could be read. Type the details by hand.')
    } catch (e) { st.fail((e as Error).message || 'Could not read the poster.') } finally { setScanning(''); void stopOcr() }
  }

  const pickPoster = async (file?: File) => {
    if (!file) return
    try { set('newPoster', await compressImage(file, 1100, 'image/jpeg', 330_000)); st.clear() } catch (e) { st.fail((e as Error).message) }
  }
  const save = async () => {
    if (!db || !form) return
    if (form.countryCode && !isCountryCode(form.countryCode)) return st.fail('Choose a country from the list.')
    if (!httpsOnly(form.mapsUrl) || !httpsOnly(form.applyUrl)) return st.fail('Map and apply links must start with https://')
    if (!form.title.trim() && !form.newPoster && !form.hasPoster) return st.fail('Add a job title or a poster picture.')
    st.ok('Saving…')
    try {
      const ref = form.id ? doc(db, 'jobs', form.id) : doc(collection(db, 'jobs'))
      let posterId = form.posterId; let hasPoster = form.hasPoster
      if (form.newPoster) {
        posterId = posterId || ref.id
        await setDoc(doc(db, 'jobImages', posterId), { data: form.newPoster, createdAt: serverTimestamp() }); hasPoster = true
      }
      const oldPositions = Array.isArray(form.raw.positions) ? (form.raw.positions as Raw[]) : []
      const first = { ...(oldPositions[0] ?? {}), title: form.title.trim() || 'Job vacancy (see poster)', category: form.category.trim() || 'General', requirements: form.requirements.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 30) }
      const data = {
        company: form.company.trim(), countryCode: form.countryCode, city: form.city.trim(), positions: [first, ...oldPositions.slice(1)],
        generalRequirements: Array.isArray(form.raw.generalRequirements) ? form.raw.generalRequirements : [], howToApply: form.howToApply.trim(),
        phones: form.phone.trim() ? [{ number: form.phone.trim(), dialCode: form.dialCode.replace(/\D/g, ''), whatsapp: form.whatsapp, calls: form.calls }] : [],
        emails: form.email.trim() ? [form.email.trim()] : [], mapsUrl: form.mapsUrl.trim(), applyUrl: form.applyUrl.trim(), tags: Array.isArray(form.raw.tags) ? form.raw.tags : [],
        status: form.status, hasPoster, posterId, autoDetected: false,
      }
      form.id ? await updateDoc(ref, data) : await setDoc(ref, { ...data, postedAt: serverTimestamp(), createdAt: serverTimestamp(), source: 'admin' })
      st.ok('Saved.'); setForm(null); await load(); await refresh()
    } catch (e) { st.fail((e as { code?: string }).code === 'permission-denied' ? 'Permission denied. Publish the latest firestore.rules.' : 'Could not save.') }
  }
  const approve = async (r: Row) => {
    if (!db) return
    try { await updateDoc(doc(db, 'jobs', r.id), { status: 'published', postedAt: serverTimestamp(), autoDetected: false }); st.ok('Approved and published.'); await load(); await refresh() }
    catch { st.fail('Could not approve. Publish the latest firestore.rules.') }
  }
  const remove = async (r: Row) => {
    if (!db || !window.confirm(`Delete "${r.title}" permanently?`)) return
    try {
      await deleteDoc(doc(db, 'jobs', r.id))
      if (r.raw.hasPoster === true) await deleteDoc(doc(db, 'jobImages', s(r.raw.posterId) || r.id))
      st.ok('Deleted.'); await load(); await refresh()
    } catch { st.fail('Could not delete.') }
  }

  if (form) return <section className="cv-card">
    <div className="cv-card-title">{form.id ? 'Edit job' : 'Add a job'}</div>
    <div className="cv-row"><AField label="Job title" value={form.title} onChange={v => set('title', v)} /><AField label="Category" value={form.category} onChange={v => set('category', v)} /></div>
    <div className="cv-row"><AField label="Company" value={form.company} onChange={v => set('company', v)} />
      <label className="cv-field"><span>Country</span><select value={form.countryCode} onChange={e => set('countryCode', e.target.value)}><option value="">Not stated</option>{countryOptions(lang).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label></div>
    <AField label="City" value={form.city} onChange={v => set('city', v)} />
    <AField label="Requirements (one per line)" area value={form.requirements} onChange={v => set('requirements', v)} />
    <AField label="How to apply" area value={form.howToApply} onChange={v => set('howToApply', v)} />
    <div className="cv-row"><AField label="Phone number" value={form.phone} onChange={v => set('phone', v)} /><AField label="Country dial code (e.g. 965)" value={form.dialCode} onChange={v => set('dialCode', v)} /></div>
    <div className="admin-checks"><label><input type="checkbox" checked={form.whatsapp} onChange={e => set('whatsapp', e.target.checked)} /> WhatsApp</label><label><input type="checkbox" checked={form.calls} onChange={e => set('calls', e.target.checked)} /> Accepts calls</label></div>
    <AField label="Email" value={form.email} onChange={v => set('email', v)} />
    <div className="cv-row"><AField label="Google Maps link (https)" value={form.mapsUrl} onChange={v => set('mapsUrl', v)} /><AField label="Apply link (https)" value={form.applyUrl} onChange={v => set('applyUrl', v)} /></div>
    <label className="cv-field"><span>Status</span><select value={form.status} onChange={e => set('status', e.target.value)}><option value="published">Published (visible)</option><option value="pending">Waiting for approval (hidden)</option><option value="draft">Draft (hidden)</option><option value="expired">Expired (shown in Old jobs)</option></select></label>
    <div className="cv-photo-row">{form.newPoster && <img src={form.newPoster} alt="New poster" style={{ width: 90, height: 120, objectFit: 'cover', borderRadius: 8 }} />}
      <label className="button button-outline">{form.hasPoster || form.newPoster ? 'Replace poster picture' : 'Add poster picture'}<input type="file" accept="image/*" hidden onChange={e => { void pickPoster(e.target.files?.[0]); e.target.value = '' }} /></label>
      {(form.hasPoster || form.newPoster) && <button className="button button-outline" disabled={!!scanning} onClick={() => void scanPoster()}>{scanning || 'Read phone / email / QR from the poster'}</button>}</div>
    <div className="admin-checks"><button className="button button-primary" onClick={() => void save()}><Save size={16}/> Save job</button><button className="button button-outline" onClick={() => { setForm(null); st.clear() }}>Cancel</button></div>
    <StatusLine status={st.status} />
  </section>

  return <section className="cv-card"><div className="admin-row-head"><div className="cv-card-title">Jobs (newest {rows.length})</div>
    <button className="button button-primary" onClick={() => { setForm(blank()); st.clear() }}><Plus size={16}/> Add a job</button></div>
    {rows.length === 0 && <p className="small-note">No jobs yet. Add one, or use "Bulk upload jobs".</p>}
    {rows.map(r => <div className="admin-row" key={r.id}><div className="admin-row-head"><strong>{r.title}</strong><span>{(r.status === 'pending' || (r.status === 'draft' && r.raw.autoDetected === true)) && <><button className="icon-btn" onClick={() => void approve(r)}>{r.status === 'pending' ? 'Approve' : 'Verify & publish'}</button> </>}<button className="icon-btn" onClick={() => setForm(toForm(r))}>Edit</button> <button className="icon-btn" onClick={() => void remove(r)}>Delete</button></span></div>
      <small>{r.company || 'Company not named'} · {r.countryCode || 'no country'} · {r.status}{r.raw.autoDetected === true ? ' · contacts read automatically: please check them' : ''}</small></div>)}
    <StatusLine status={st.status} /></section>
}
