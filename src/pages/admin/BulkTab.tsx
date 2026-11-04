import { useState } from 'react'
import { collection, doc, getCountFromServer, getDocs, limit, query, serverTimestamp, setDoc, Timestamp, where, writeBatch } from 'firebase/firestore'
import { Download, Trash2, Upload } from 'lucide-react'
import { db } from '../../lib/firebase'
import { countryOptions, isCountryCode } from '../../lib/countries'
import { useLang } from '../../i18n/LanguageContext'
import { useJobs } from '../../context/Jobs'
import { readFiles, TEMPLATE_CSV, type PosterImage, type SheetJob } from './bulk'
import { detectPosterContacts, stopOcr } from '../../lib/ocr'
import type { Detected } from '../../lib/extract'
import { AField, StatusLine, useStatus } from './ui'

const httpsOrEmpty = (u: string) => (/^https:\/\/\S+$/i.test(u.trim()) ? u.trim() : '')
const STATUSES = ['published', 'draft', 'pending', 'expired']

export default function BulkTab() {
  const { lang } = useLang()
  const { refresh } = useJobs()
  const [images, setImages] = useState<PosterImage[]>([])
  const [rows, setRows] = useState<SheetJob[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [d, setD] = useState({ countryCode: '', category: 'General', title: '', company: '', phone: '', dialCode: '', email: '', status: 'published' })
  const [useOcr, setUseOcr] = useState(true)
  const [days, setDays] = useState('30')
  const [oldCount, setOldCount] = useState<number | null>(null)
  const st = useStatus()
  const cl = useStatus()
  const set = (k: keyof typeof d, v: string) => setD(x => ({ ...x, [k]: v }))

  const pick = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setBusy(true); st.clear(); setImages([]); setRows([]); setSkipped([])
    try {
      const r = await readFiles(Array.from(list), setProgress)
      setImages(r.images); setRows(r.rows); setSkipped(r.skipped)
      st.ok(`Ready: ${r.images.length} poster picture(s) and ${r.rows.length} spreadsheet job(s).`)
    } catch (e) { st.fail((e as Error).message) }
    setBusy(false); setProgress('')
  }

  const upload = async () => {
    if (!db) return st.fail('Firebase is not configured.')
    if (images.length > 0 && !isCountryCode(d.countryCode)) return st.fail('Choose the country for the poster pictures first.')
    if (!window.confirm(`Upload ${images.length + rows.length} job(s)?`)) return
    setBusy(true); st.clear()
    const batchId = Date.now().toString(36); let done = 0; const failed: string[] = []
    const total = images.length + rows.length
    const phone = d.phone.trim()
    const sharedPhones = phone ? [{ number: phone, dialCode: d.dialCode.replace(/\D/g, ''), whatsapp: true, calls: false }] : []
    const jobs: (() => Promise<void>)[] = []
    let autoCount = 0
    for (const img of images) jobs.push(async () => {
      const ref = doc(collection(db!, 'jobs'))
      // Optional: read phone numbers, emails, links and QR codes from the poster. Anything found is saved as a DRAFT for an admin to check.
      let found: Detected | null = null
      if (useOcr) { try { found = await detectPosterContacts(img.data, d.countryCode, setProgress) } catch { found = null } }
      const seen = new Set<string>(); const phones: { number: string; dialCode: string; whatsapp: boolean; calls: boolean }[] = []
      for (const p of [...sharedPhones, ...(found?.phones ?? [])]) { const k = `${p.dialCode}|${p.number}`; if (p.number && !seen.has(k)) { seen.add(k); phones.push({ number: p.number, dialCode: p.dialCode, whatsapp: p.whatsapp, calls: p.calls }) } }
      const emails = Array.from(new Set([...(d.email.trim() ? [d.email.trim()] : []), ...(found?.emails ?? [])])).slice(0, 4)
      const auto = !!found && (found.phones.length > 0 || found.emails.length > 0 || !!found.mapsUrl || !!found.applyUrl)
      if (auto) autoCount++
      await setDoc(doc(db!, 'jobImages', ref.id), { data: img.data, createdAt: serverTimestamp() })
      await setDoc(ref, {
        company: d.company.trim(), countryCode: d.countryCode, city: '', positions: [{ title: d.title.trim() || 'Job vacancy (see poster)', category: d.category.trim() || 'General', requirements: [] }],
        generalRequirements: [], howToApply: '', phones: phones.slice(0, 4), emails, mapsUrl: httpsOrEmpty(found?.mapsUrl ?? ''), applyUrl: httpsOrEmpty(found?.applyUrl ?? ''), tags: [],
        status: auto ? 'draft' : (STATUSES.includes(d.status) ? d.status : 'draft'), hasPoster: true, posterId: ref.id, postedAt: serverTimestamp(), createdAt: serverTimestamp(), source: 'bulk', batchId, autoDetected: auto,
      })
    })
    for (const r of rows) jobs.push(async () => {
      const ref = doc(collection(db!, 'jobs'))
      await setDoc(ref, {
        company: r.company, countryCode: isCountryCode(r.countryCode) ? r.countryCode : d.countryCode, city: r.city,
        positions: [{ title: r.title, category: r.category, requirements: r.requirements.slice(0, 30) }], generalRequirements: [], howToApply: r.howToApply,
        phones: r.phone ? [{ number: r.phone, dialCode: r.dialCode, whatsapp: r.whatsapp, calls: r.calls }] : [], emails: r.email ? [r.email] : [],
        mapsUrl: httpsOrEmpty(r.mapsUrl), applyUrl: httpsOrEmpty(r.applyUrl), tags: [], status: STATUSES.includes(r.status) ? r.status : (STATUSES.includes(d.status) ? d.status : 'draft'),
        hasPoster: false, posterId: '', postedAt: serverTimestamp(), createdAt: serverTimestamp(), source: 'sheet', batchId,
      })
    })
    let next = 0
    const worker = async () => {
      while (next < jobs.length) {
        const i = next++
        try { await jobs[i]() } catch { failed.push(`item ${i + 1}`) }
        done++; setProgress(`Uploading ${done} of ${total}…`)
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()])
    await stopOcr()
    setBusy(false); setProgress('')
    if (failed.length === total) st.fail('Nothing was uploaded. Publish the latest firestore.rules and check your admin account.')
    else { st.ok(`Uploaded ${total - failed.length} of ${total}.${failed.length ? ` Failed: ${failed.join(', ')}.` : ''}${autoCount ? ` ${autoCount} poster(s) had contact details read automatically and were saved as DRAFT. Open the Jobs tab, check the numbers, then press Verify & publish.` : ''}`); setImages([]); setRows([]); await refresh() }
  }

  const cutoff = () => Timestamp.fromDate(new Date(Date.now() - Math.max(1, Number(days) || 30) * 86_400_000))
  const countOld = async () => {
    if (!db) return
    try { setOldCount((await getCountFromServer(query(collection(db, 'jobs'), where('postedAt', '<', cutoff())))).data().count); cl.clear() } catch { cl.fail('Could not count. Check your admin account and rules.') }
  }
  const deleteOld = async () => {
    if (!db || !oldCount || !window.confirm(`Permanently delete ${oldCount} job(s) older than ${days} days, with their poster pictures? This cannot be undone.`)) return
    setBusy(true); let removed = 0
    try {
      for (let guard = 0; guard < 100; guard++) {
        const snap = await getDocs(query(collection(db, 'jobs'), where('postedAt', '<', cutoff()), limit(200)))
        if (snap.empty) break
        const batch = writeBatch(db)
        snap.docs.forEach(j => { batch.delete(j.ref); const x = j.data() as { hasPoster?: boolean; posterId?: string }; if (x.hasPoster) batch.delete(doc(db!, 'jobImages', x.posterId || j.id)) })
        await batch.commit(); removed += snap.size; setProgress(`Deleted ${removed}…`)
      }
      cl.ok(`Deleted ${removed} old job(s).`); setOldCount(0); await refresh()
    } catch { cl.fail(`Stopped after deleting ${removed}. Try again.`) }
    setBusy(false); setProgress('')
  }
  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'jobs-template.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return <div className="admin-shell">
    <section className="cv-card">
      <div className="cv-card-title">Bulk upload jobs</div>
      <p className="small-note">Pick many files at once: poster pictures (PNG/JPG/WebP), PDF files (each page becomes a poster), ZIP files with pictures, and Excel (.xlsx) or CSV job lists. Pictures are made smaller automatically.</p>
      <label className="button button-outline"><Upload size={16}/> Choose files<input type="file" multiple hidden disabled={busy} accept="image/*,.pdf,.zip,.csv,.xlsx" onChange={e => { void pick(e.target.files); e.target.value = '' }} /></label>
      <button className="button button-outline" onClick={downloadTemplate}><Download size={16}/> Download Excel/CSV template</button>
      {progress && <p className="small-note" role="status">{progress}</p>}
      {skipped.map(m => <p className="notice" key={m}>{m}</p>)}
      <div className="cv-card-title">Details for the poster pictures</div>
      <div className="cv-row">
        <label className="cv-field"><span>Country (required for pictures)</span><select value={d.countryCode} onChange={e => set('countryCode', e.target.value)}><option value="">Choose…</option>{countryOptions(lang).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
        <AField label="Category" value={d.category} onChange={v => set('category', v)} />
      </div>
      <div className="cv-row"><AField label="Job title (optional)" value={d.title} onChange={v => set('title', v)} /><AField label="Company (optional)" value={d.company} onChange={v => set('company', v)} /></div>
      <div className="cv-row"><AField label="WhatsApp number (optional)" value={d.phone} onChange={v => set('phone', v)} /><AField label="Country dial code (e.g. 965)" value={d.dialCode} onChange={v => set('dialCode', v)} /></div>
      <AField label="Email (optional)" value={d.email} onChange={v => set('email', v)} />
      <label className="admin-checks"><span><input type="checkbox" checked={useOcr} onChange={e => setUseOcr(e.target.checked)} /> Read phone numbers, emails, links and QR codes from the poster pictures (slower, needs internet; results are saved as Draft for you to check)</span></label>
      <label className="cv-field"><span>After upload</span><select value={d.status} onChange={e => set('status', e.target.value)}><option value="published">Publish now</option><option value="draft">Save as draft (hidden)</option></select></label>
      <button className="button button-primary" disabled={busy || images.length + rows.length === 0} onClick={() => void upload()}><Upload size={16}/> Upload {images.length + rows.length} job(s)</button>
      <StatusLine status={st.status} />
    </section>
    <section className="cv-card">
      <div className="cv-card-title">Delete old jobs in one click</div>
      <div className="cv-row"><AField label="Older than (days)" value={days} onChange={v => { setDays(v); setOldCount(null) }} /></div>
      <button className="button button-outline" disabled={busy} onClick={() => void countOld()}>Count old jobs</button>
      {oldCount !== null && <p className="small-note">{oldCount} job(s) are older than {days} days.</p>}
      <button className="button button-primary" disabled={busy || !oldCount} onClick={() => void deleteOld()}><Trash2 size={16}/> Delete these jobs</button>
      <StatusLine status={cl.status} />
    </section>
  </div>
}
