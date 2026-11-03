import { useCallback, useEffect, useState } from 'react'
import { collection, getCountFromServer, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { RefreshCw } from 'lucide-react'
import { db } from '../../lib/firebase'
import { toDate } from '../../lib/social'

type Counts = Record<string, number | null>
const CARDS: [string, string, string][] = [['users', 'Registered users', 'users'], ['jobs', 'Jobs', 'jobs'], ['feed', 'Feed posts', 'moderation'], ['reports', 'Open reports', 'moderation'], ['connections', 'Connections', 'users']]

export default function DashboardTab({ go }: { go: (tab: string) => void }) {
  const [counts, setCounts] = useState<Counts>({})
  const [users, setUsers] = useState<{ id: string; name: string; type: string; when: Date }[]>([])
  const [jobs, setJobs] = useState<{ id: string; title: string; company: string; status: string }[]>([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!db) return
    setError('')
    const next: Counts = {}
    await Promise.all(CARDS.map(async ([name]) => {
      try { next[name] = (await getCountFromServer(collection(db!, name))).data().count } catch { next[name] = null }
    }))
    setCounts(next)
    try {
      const u = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(6)))
      setUsers(u.docs.map(d => { const x = d.data() as Record<string, unknown>; return { id: d.id, name: String(x.displayName ?? ''), type: String(x.accountType ?? ''), when: toDate(x.createdAt) } }))
      const j = await getDocs(query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), limit(6)))
      setJobs(j.docs.map(d => { const x = d.data() as Record<string, unknown>; const p = (Array.isArray(x.positions) ? x.positions[0] : null) as { title?: string } | null; return { id: d.id, title: String(p?.title ?? 'Job'), company: String(x.company ?? ''), status: String(x.status ?? '') } }))
    } catch { setError('Some data could not be loaded. Publish the latest firestore.rules and check your admin account.') }
  }, [])
  useEffect(() => { void load() }, [load])

  return <div className="admin-shell">
    <section className="cv-card">
      <div className="admin-row-head"><div className="cv-card-title">Overview</div><button className="icon-btn" onClick={() => void load()}><RefreshCw size={14}/> Refresh</button></div>
      <div className="admin-grid">{CARDS.map(([name, label, tab]) => <button key={name} className="theme-card" onClick={() => go(tab)}>
        <strong style={{ fontSize: '1.6rem' }}>{counts[name] === undefined ? '…' : counts[name] === null ? '—' : counts[name]}</strong><small>{label}</small></button>)}</div>
      {error && <p className="notice auth-error">{error}</p>}
    </section>
    <section className="cv-card"><div className="cv-card-title">Quick actions</div>
      <div className="admin-tabs">
        <button className="tab-btn" onClick={() => go('bulk')}>Bulk upload jobs</button><button className="tab-btn" onClick={() => go('jobs')}>Add or edit a job</button>
        <button className="tab-btn" onClick={() => go('pageeditor')}>Edit page texts</button><button className="tab-btn" onClick={() => go('home')}>Home sections</button>
        <button className="tab-btn" onClick={() => go('moderation')}>Review reports</button></div></section>
    <section className="cv-card"><div className="cv-card-title">Newest members</div>
      {users.length === 0 && <p className="small-note">No members yet.</p>}
      {users.map(u => <div className="admin-row" key={u.id}><strong>{u.name || 'Member'}</strong><small>{u.type} · {u.when.toLocaleString()}</small></div>)}</section>
    <section className="cv-card"><div className="cv-card-title">Newest jobs</div>
      {jobs.length === 0 && <p className="small-note">No jobs yet. Use "Bulk upload jobs" to add posters.</p>}
      {jobs.map(j => <div className="admin-row" key={j.id}><strong>{j.title}</strong><small>{j.company || 'Company not named'} · {j.status}</small></div>)}</section>
  </div>
}
