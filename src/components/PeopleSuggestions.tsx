import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { useConnections } from '../hooks/useConnections'
import { useProfile } from '../hooks/useProfile'
import { sanitizeProfile, typeLabel, type Profile } from '../lib/social'
import { countryName } from '../lib/countries'
import { useLang } from '../i18n/LanguageContext'
import Avatar from './Avatar'

type Person = { uid: string; profile: Profile; score: number }

/** "People you may know": same country, complementary roles (seekers with HR/employers) and shared skills rank higher. */
export default function PeopleSuggestions({ max = 6 }: { max?: number }) {
  const { user } = useAuth()
  const { lang } = useLang()
  const { items, connect, uid } = useConnections()
  const { profile: mine } = useProfile(user?.uid, user?.displayName ?? '')
  const [people, setPeople] = useState<Person[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db || !uid) return
    let cancelled = false
    getDocs(query(collection(db, 'profiles'), where('visibility', 'in', ['members', 'public']), limit(60))).then(snap => {
      if (cancelled) return
      setPeople(snap.docs.filter(d => d.id !== uid).map(d => ({ uid: d.id, profile: sanitizeProfile(d.data()), score: 0 })))
      setLoaded(true)
    }).catch(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [uid])

  if (!user) return null
  const known = new Set(items.map(c => c.users.find(u => u !== uid)))
  const ranked = people.filter(p => !known.has(p.uid)).map(p => {
    let score = Math.random() * 0.5
    if (mine && p.profile.countryCode && p.profile.countryCode === mine.countryCode) score += 3
    if (mine && mine.accountType !== p.profile.accountType) score += 1.5
    if (mine) score += p.profile.skills.filter(s => mine.skills.map(x => x.toLowerCase()).includes(s.toLowerCase())).length
    return { ...p, score }
  }).sort((a, b) => b.score - a.score).slice(0, max)

  const doConnect = async (p: Person) => {
    setBusy(p.uid); setError('')
    try { await connect(p.uid, p.profile.displayName) } catch { setError('Could not send the request. Verify your email first, then try again.') }
    setBusy('')
  }
  if (loaded && ranked.length === 0) return <p className="small-note">No suggestions yet. They appear as more members create profiles.</p>
  return <div className="people-grid">
    {error && <p className="notice auth-error">{error}</p>}
    {ranked.map(p => <div className="person-card" key={p.uid}>
      <Link to={`/u/${p.uid}`}><Avatar name={p.profile.displayName} photo={p.profile.photo} size={64} /></Link>
      <Link to={`/u/${p.uid}`} className="person-name">{p.profile.displayName}</Link>
      <small>{p.profile.headline || typeLabel(p.profile.accountType)}</small>
      {p.profile.countryCode && <small>{countryName(p.profile.countryCode, lang)}</small>}
      <button className="button button-outline" disabled={busy === p.uid} onClick={() => void doConnect(p)}>Connect</button>
    </div>)}
  </div>
}
