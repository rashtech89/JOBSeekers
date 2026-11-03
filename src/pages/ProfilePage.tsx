import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Camera, Link2, MapPin, MessageCircle, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'
import { useProfile } from '../hooks/useProfile'
import { useConnections } from '../hooks/useConnections'
import { compressImage } from '../lib/images'
import { countryName, countryOptions } from '../lib/countries'
import { emptyProfile, sanitizeProfile, typeLabel, type AccountType, type Profile, type Visibility } from '../lib/social'
import Avatar from '../components/Avatar'

const split = (v: string) => v.split(/[\n,;،]+/).map(x => x.trim()).filter(Boolean)

function ProfileEditor({ initial, onSave, onCancel }: { initial: Profile; onSave: (p: Profile) => Promise<string>; onCancel: () => void }) {
  const { lang } = useLang()
  const [p, setP] = useState<Profile>(initial)
  const [skills, setSkills] = useState(initial.skills.join(', '))
  const [languages, setLanguages] = useState(initial.languages.join(', '))
  const [certs, setCerts] = useState(initial.certificates.join('\n'))
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP(x => ({ ...x, [k]: v }))
  const pick = async (file: File | undefined, key: 'photo' | 'cover') => {
    if (!file) return
    try { set(key, await compressImage(file, key === 'photo' ? 320 : 1200, key === 'photo' ? 'image/webp' : 'image/jpeg', key === 'photo' ? 70_000 : 230_000)); setMsg('') } catch (e) { setMsg((e as Error).message) }
  }
  const submit = async () => {
    setBusy(true)
    const result = await onSave({ ...p, skills: split(skills).slice(0, 40), languages: split(languages).slice(0, 20), certificates: certs.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 30) })
    setMsg(result); setBusy(false)
  }
  return <div className="cv-card profile-editor">
    <div className="cv-card-title">Edit profile</div>
    <div className="cv-photo-row">
      <Avatar name={p.displayName} photo={p.photo} size={72} />
      <label className="button button-outline"><Camera size={16}/> Profile photo<input type="file" accept="image/*" hidden onChange={e => { void pick(e.target.files?.[0], 'photo'); e.target.value = '' }} /></label>
      {p.photo && <button className="button button-outline" onClick={() => set('photo', '')}>Remove</button>}
    </div>
    <div className="cv-photo-row">
      {p.cover && <img src={p.cover} alt="" style={{ width: 160, height: 56, borderRadius: 8, objectFit: 'cover' }} />}
      <label className="button button-outline"><Camera size={16}/> Cover photo<input type="file" accept="image/*" hidden onChange={e => { void pick(e.target.files?.[0], 'cover'); e.target.value = '' }} /></label>
      {p.cover && <button className="button button-outline" onClick={() => set('cover', '')}>Remove</button>}
    </div>
    <label className="cv-field"><span>Full name</span><input value={p.displayName} maxLength={80} onChange={e => set('displayName', e.target.value)} /></label>
    <label className="cv-field"><span>Headline</span><input value={p.headline} maxLength={200} onChange={e => set('headline', e.target.value)} placeholder="e.g. Mechanical Supervisor, HVAC and Plumbing" /></label>
    <div className="cv-row">
      <label className="cv-field"><span>City / area</span><input value={p.location} maxLength={100} onChange={e => set('location', e.target.value)} /></label>
      <label className="cv-field"><span>Country</span><select value={p.countryCode} onChange={e => set('countryCode', e.target.value)}><option value="">—</option>{countryOptions(lang).map(o => <option key={o.code} value={o.code}>{o.name}</option>)}</select></label>
    </div>
    <div className="cv-row">
      <label className="cv-field"><span>I am a</span><select value={p.accountType} onChange={e => set('accountType', e.target.value as AccountType)}><option value="seeker">Job seeker</option><option value="employer">Employer</option><option value="hr">HR / Recruiter</option></select></label>
      <label className="cv-field"><span>Who can see my profile</span><select value={p.visibility} onChange={e => set('visibility', e.target.value as Visibility)}><option value="members">Signed-in members</option><option value="public">Anyone with the link</option><option value="private">Only me</option></select></label>
    </div>
    <label className="cv-check"><input type="checkbox" checked={p.openToWork} onChange={e => set('openToWork', e.target.checked)} /> Open to work</label>
    <label className="cv-field"><span>About</span><textarea rows={5} maxLength={2600} value={p.about} onChange={e => set('about', e.target.value)} /></label>

    <div className="cv-card-title">Experience</div>
    {p.experience.map((x, i) => <div className="cv-subcard" key={i}>
      <div className="cv-row">
        <label className="cv-field"><span>Title</span><input value={x.title} onChange={e => set('experience', p.experience.map((y, j) => j === i ? { ...y, title: e.target.value } : y))} /></label>
        <label className="cv-field"><span>Company</span><input value={x.company} onChange={e => set('experience', p.experience.map((y, j) => j === i ? { ...y, company: e.target.value } : y))} /></label>
      </div>
      <div className="cv-row">
        <label className="cv-field"><span>From</span><input value={x.from} onChange={e => set('experience', p.experience.map((y, j) => j === i ? { ...y, from: e.target.value } : y))} /></label>
        <label className="cv-field"><span>To</span><input value={x.to} placeholder="Present" onChange={e => set('experience', p.experience.map((y, j) => j === i ? { ...y, to: e.target.value } : y))} /></label>
      </div>
      <label className="cv-field"><span>Description</span><textarea rows={3} value={x.description} onChange={e => set('experience', p.experience.map((y, j) => j === i ? { ...y, description: e.target.value } : y))} /></label>
      <button className="button button-outline" onClick={() => set('experience', p.experience.filter((_, j) => j !== i))}><Trash2 size={15}/> Remove</button>
    </div>)}
    <button className="button button-outline" onClick={() => set('experience', [...p.experience, { title: '', company: '', from: '', to: '', description: '' }])}><Plus size={15}/> Add experience</button>

    <div className="cv-card-title">Education</div>
    {p.education.map((x, i) => <div className="cv-subcard" key={i}>
      <div className="cv-row">
        <label className="cv-field"><span>School</span><input value={x.school} onChange={e => set('education', p.education.map((y, j) => j === i ? { ...y, school: e.target.value } : y))} /></label>
        <label className="cv-field"><span>Degree</span><input value={x.degree} onChange={e => set('education', p.education.map((y, j) => j === i ? { ...y, degree: e.target.value } : y))} /></label>
      </div>
      <div className="cv-row">
        <label className="cv-field"><span>From</span><input value={x.from} onChange={e => set('education', p.education.map((y, j) => j === i ? { ...y, from: e.target.value } : y))} /></label>
        <label className="cv-field"><span>To</span><input value={x.to} onChange={e => set('education', p.education.map((y, j) => j === i ? { ...y, to: e.target.value } : y))} /></label>
      </div>
      <button className="button button-outline" onClick={() => set('education', p.education.filter((_, j) => j !== i))}><Trash2 size={15}/> Remove</button>
    </div>)}
    <button className="button button-outline" onClick={() => set('education', [...p.education, { school: '', degree: '', from: '', to: '' }])}><Plus size={15}/> Add education</button>

    <label className="cv-field"><span>Skills</span><textarea rows={2} value={skills} onChange={e => setSkills(e.target.value)} /><small>Separate with commas</small></label>
    <label className="cv-field"><span>Languages</span><input value={languages} onChange={e => setLanguages(e.target.value)} /><small>Separate with commas</small></label>
    <label className="cv-field"><span>Certificates (one per line)</span><textarea rows={3} value={certs} onChange={e => setCerts(e.target.value)} /></label>
    <div className="admin-checks">
      <button className="button button-primary" disabled={busy} onClick={() => void submit()}><Save size={16}/> Save profile</button>
      <button className="button button-outline" onClick={onCancel}>Cancel</button>
    </div>
    {msg && <p className="small-note" role="status">{msg}</p>}
  </div>
}

export default function ProfilePage() {
  const params = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { lang } = useLang()
  const uid = params.uid ?? user?.uid
  const isMe = !!user && uid === user.uid
  const { profile, exists, loading, denied, setProfile } = useProfile(uid, isMe ? user?.displayName ?? '' : '')
  const { items, connect, accept, remove, uid: me } = useConnections()
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState<AccountType>('seeker')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!db || !user || !isMe) return
    getDoc(doc(db, 'users', user.uid)).then(s => { const t = (s.data() as { accountType?: string } | undefined)?.accountType; if (t === 'employer' || t === 'hr' || t === 'seeker') setType(t) }).catch(() => undefined)
  }, [user, isMe])

  if (authLoading) return <div className="content-page"><p>Loading…</p></div>
  if (!params.uid && !user) return <Navigate to="/login" replace />
  if (params.uid && !user) return <div className="content-page"><div className="auth-card"><h1>Profile</h1><p>Sign in to view member profiles.</p><Link className="button button-primary full-button" to="/login">Sign in</Link></div></div>

  const save = async (p: Profile): Promise<string> => {
    if (!db || !user) return 'Not connected.'
    const clean = sanitizeProfile(p, user.displayName ?? '')
    try {
      await setDoc(doc(db, 'profiles', user.uid), { ...clean, updatedAt: serverTimestamp() })
      setProfile(clean); setEditing(false); return 'Saved.'
    } catch (e) { return (e as { code?: string }).code === 'permission-denied' ? 'Permission denied. Publish the latest firestore.rules first.' : 'Could not save. Check the photo sizes and try again.' }
  }

  const shareLink = `${window.location.origin}${import.meta.env.BASE_URL}u/${uid}`
  const copyLink = async () => { try { await navigator.clipboard.writeText(shareLink); setNote('Profile link copied.') } catch { setNote(shareLink) } }

  if (loading) return <div className="content-page"><p>Loading…</p></div>
  if (isMe && (editing || !exists)) {
    return <div className="content-page page-enter profile-page">
      {!exists && !editing && <div className="auth-card"><h1>Create your profile</h1><p>Add your photo, headline and experience so employers, HR and other members can find you.</p><button className="button button-primary full-button" onClick={() => setEditing(true)}>Create profile</button></div>}
      {(editing || (!exists && editing)) && <ProfileEditor initial={profile ?? emptyProfile(user?.displayName ?? '', type)} onSave={save} onCancel={() => { setEditing(false); if (!exists) navigate('/account') }} />}
    </div>
  }
  if (!profile) return <div className="content-page"><div className="auth-card"><h1>Profile not available</h1><p>{denied ? 'This profile is private.' : 'This member has not created a profile yet.'}</p><Link className="button button-outline full-button" to="/network">My network</Link></div></div>

  const conn = items.find(c => uid && c.users.includes(uid))
  return <div className="content-page page-enter profile-page">
    <section className="profile-card">
      <div className="profile-cover" style={profile.cover ? { backgroundImage: `url(${profile.cover})` } : undefined} />
      <div className="profile-head">
        <Avatar name={profile.displayName} photo={profile.photo} size={120} />
        <div className="profile-actions">
          {isMe && <button className="button button-outline" onClick={() => setEditing(true)}><Pencil size={16}/> Edit profile</button>}
          {isMe && <button className="button button-outline" onClick={() => void copyLink()}><Link2 size={16}/> Share link</button>}
          {!isMe && !conn && <button className="button button-primary" onClick={() => { void connect(uid!, profile.displayName).then(() => setNote('Request sent.')).catch(() => setNote('Could not send. Verify your email first.')) }}>Connect</button>}
          {!isMe && conn?.status === 'pending' && conn.to === me && <button className="button button-primary" onClick={() => void accept(conn)}>Accept request</button>}
          {!isMe && conn?.status === 'pending' && conn.from === me && <button className="button button-outline" onClick={() => void remove(conn.id)}>Request sent · Cancel</button>}
          {!isMe && conn?.status === 'accepted' && <Link className="button button-primary" to={`/messages?with=${conn.id}`}><MessageCircle size={16}/> Message</Link>}
        </div>
        <h1>{profile.displayName}</h1>
        {profile.headline && <p className="profile-headline">{profile.headline}</p>}
        <p className="profile-meta">{typeLabel(profile.accountType)}{(profile.location || profile.countryCode) && <> · <MapPin size={14}/> {[profile.location, profile.countryCode ? countryName(profile.countryCode, lang) : ''].filter(Boolean).join(', ')}</>}</p>
        {profile.openToWork && <span className="status-pill open-to-work">Open to work</span>}
        {isMe && <p className="small-note">Visible to: {profile.visibility === 'members' ? 'signed-in members' : profile.visibility === 'public' ? 'anyone with the link' : 'only you'}</p>}
        {note && <p className="small-note" role="status">{note}</p>}
      </div>
    </section>
    {profile.about && <section className="profile-section"><h2>About</h2><p className="cv-text">{profile.about}</p></section>}
    {profile.experience.length > 0 && <section className="profile-section"><h2>Experience</h2>{profile.experience.map((x, i) => <div className="profile-item" key={i}><strong>{x.title}</strong><span>{x.company}</span><small>{[x.from, x.to || (x.from ? 'Present' : '')].filter(Boolean).join(' – ')}</small>{x.description && <p className="cv-text">{x.description}</p>}</div>)}</section>}
    {profile.education.length > 0 && <section className="profile-section"><h2>Education</h2>{profile.education.map((x, i) => <div className="profile-item" key={i}><strong>{x.school}</strong><span>{x.degree}</span><small>{[x.from, x.to].filter(Boolean).join(' – ')}</small></div>)}</section>}
    {profile.skills.length > 0 && <section className="profile-section"><h2>Skills</h2><div className="cv-chips">{profile.skills.map(s => <span key={s}>{s}</span>)}</div></section>}
    {profile.certificates.length > 0 && <section className="profile-section"><h2>Certificates</h2>{profile.certificates.map(c => <p key={c}>{c}</p>)}</section>}
    {profile.languages.length > 0 && <section className="profile-section"><h2>Languages</h2><div className="cv-chips">{profile.languages.map(s => <span key={s}>{s}</span>)}</div></section>}
  </div>
}
