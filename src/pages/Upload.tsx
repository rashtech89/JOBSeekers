import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ImagePlus, ShieldCheck } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'
import { compressImage } from '../lib/images'
import { countryOptions, isCountryCode } from '../lib/countries'
import { AField, StatusLine, useStatus } from './admin/ui'

const httpsOnly = (u: string) => !u.trim() || /^https:\/\/\S+$/i.test(u.trim())

/** Employer / HR submission. Every post waits for admin approval before it appears on the site. */
export default function Upload() {
  const { user, loading } = useAuth()
  const { lang } = useLang()
  const st = useStatus()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [f, setF] = useState({ poster: '', title: '', category: 'General', company: '', countryCode: '', city: '', requirements: '', phone: '', dialCode: '', whatsapp: true, email: '', applyUrl: '' })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }))

  if (loading) return <div className="content-page"><p>Loading…</p></div>
  if (!user) return <div className="content-page page-enter"><div className="auth-card"><h1>Post a job</h1><p>Please sign in to submit a job. Every post is checked by our team before it is shown.</p>
    <Link className="button button-primary full-button" to="/login">Sign in</Link><Link className="button button-outline full-button" to="/register">Create account</Link></div></div>
  if (!user.emailVerified) return <div className="content-page page-enter"><div className="auth-card"><h1>Verify your email</h1><p className="notice">Verify your email first (check Inbox and Spam), then come back to post.</p>
    <Link className="button button-primary full-button" to="/account">Open my account</Link></div></div>
  if (sent) return <div className="content-page page-enter"><div className="auth-card"><h1>Thank you</h1><p>Your job was sent for approval. It appears on the site after our team checks it.</p>
    <button className="button button-primary full-button" onClick={() => { setSent(false); setF(p => ({ ...p, poster: '', title: '', requirements: '' })) }}>Post another job</button><Link className="button button-outline full-button" to="/">Go to Home</Link></div></div>

  const pickPoster = async (file?: File) => {
    if (!file) return
    try { set('poster', await compressImage(file, 1100, 'image/jpeg', 330_000)); st.clear() } catch (e) { st.fail((e as Error).message) }
  }
  const submit = async () => {
    if (!db) return st.fail('Posting is not available right now.')
    if (!f.poster && !f.title.trim()) return st.fail('Add a poster picture or a job title.')
    if (!isCountryCode(f.countryCode)) return st.fail('Choose the country of the job.')
    if (!f.phone.trim() && !f.email.trim() && !f.applyUrl.trim()) return st.fail('Add at least one way to apply: phone/WhatsApp, email or an apply link.')
    if (!httpsOnly(f.applyUrl)) return st.fail('The apply link must start with https://')
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return st.fail('The email address is not valid.')
    setBusy(true); st.ok('Sending…')
    try {
      const ref = doc(collection(db, 'jobs'))
      if (f.poster) await setDoc(doc(db, 'jobImages', ref.id), { data: f.poster, createdAt: serverTimestamp(), createdBy: user.uid })
      await setDoc(ref, {
        company: f.company.trim().slice(0, 120), countryCode: f.countryCode, city: f.city.trim().slice(0, 100),
        positions: [{ title: f.title.trim().slice(0, 120) || 'Job vacancy (see poster)', category: f.category.trim().slice(0, 60) || 'General', requirements: f.requirements.split('\n').map(x => x.trim().slice(0, 300)).filter(Boolean).slice(0, 20) }],
        generalRequirements: [], howToApply: '',
        phones: f.phone.trim() ? [{ number: f.phone.trim().slice(0, 30), dialCode: f.dialCode.replace(/\D/g, '').slice(0, 6), whatsapp: f.whatsapp, calls: false }] : [],
        emails: f.email.trim() ? [f.email.trim().slice(0, 120)] : [], mapsUrl: '', applyUrl: f.applyUrl.trim(), tags: [],
        status: 'pending', hasPoster: !!f.poster, posterId: f.poster ? ref.id : '', postedAt: serverTimestamp(), createdAt: serverTimestamp(), source: 'user', createdBy: user.uid, authorName: (user.displayName || 'Member').slice(0, 80),
      })
      st.clear(); setSent(true)
    } catch (e) { st.fail((e as { code?: string }).code === 'permission-denied' ? 'Not allowed. Make sure your email is verified, then sign out and in again.' : 'Could not send. Try again.') }
    setBusy(false)
  }

  return <div className="content-page narrow-page page-enter">
    <div className="page-heading"><p className="eyebrow">EMPLOYER WORKSPACE</p><h1>Post a job</h1><p>Upload the job poster or fill the details. Our team approves every post before it is shown.</p></div>
    <section className="cv-card">
      <div className="cv-photo-row">{f.poster && <img src={f.poster} alt="Poster preview" style={{ width: 90, height: 120, objectFit: 'cover', borderRadius: 8 }} />}
        <label className="button button-outline"><ImagePlus size={16}/> {f.poster ? 'Replace poster picture' : 'Add poster picture'}<input type="file" accept="image/*" hidden onChange={e => { void pickPoster(e.target.files?.[0]); e.target.value = '' }} /></label></div>
      <div className="cv-row"><AField label="Job title" value={f.title} onChange={v => set('title', v)} /><AField label="Category" value={f.category} onChange={v => set('category', v)} /></div>
      <div className="cv-row"><AField label="Company" value={f.company} onChange={v => set('company', v)} />
        <label className="cv-field"><span>Country</span><select value={f.countryCode} onChange={e => set('countryCode', e.target.value)}><option value="">Choose…</option>{countryOptions(lang).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label></div>
      <AField label="City" value={f.city} onChange={v => set('city', v)} />
      <AField label="Requirements (one per line)" area value={f.requirements} onChange={v => set('requirements', v)} />
      <div className="cv-row"><AField label="Phone / WhatsApp number" value={f.phone} onChange={v => set('phone', v)} /><AField label="Country dial code (e.g. 965)" value={f.dialCode} onChange={v => set('dialCode', v)} /></div>
      <label className="admin-checks"><span><input type="checkbox" checked={f.whatsapp} onChange={e => set('whatsapp', e.target.checked)} /> This number is on WhatsApp</span></label>
      <div className="cv-row"><AField label="Email" value={f.email} onChange={v => set('email', v)} /><AField label="Apply link (https)" value={f.applyUrl} onChange={v => set('applyUrl', v)} /></div>
      <p className="notice"><ShieldCheck size={17}/> Never ask applicants to pay money. Posts that ask for fees are removed.</p>
      <button className="button button-primary" disabled={busy} onClick={() => void submit()}>Send for approval</button>
      <StatusLine status={st.status} />
    </section>
  </div>
}
