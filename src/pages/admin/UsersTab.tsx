import { useCallback, useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/Auth'
import { toDate } from '../../lib/social'
import { StatusLine, useStatus } from './ui'

type U = { id: string; name: string; email: string; type: string; when: Date }

export default function UsersTab() {
  const { user } = useAuth()
  const [users, setUsers] = useState<U[]>([])
  const [admins, setAdmins] = useState<string[]>([])
  const [filter, setFilter] = useState('')
  const s = useStatus()
  const load = useCallback(async () => {
    if (!db) return
    try {
      const u = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200)))
      setUsers(u.docs.map(d => { const x = d.data() as Record<string, unknown>; return { id: d.id, name: String(x.displayName ?? ''), email: String(x.email ?? ''), type: String(x.accountType ?? ''), when: toDate(x.createdAt) } }))
      setAdmins((await getDocs(collection(db, 'admins'))).docs.map(d => d.id))
    } catch { s.fail('Could not load. Publish the latest firestore.rules and check your admin account.') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { void load() }, [load])

  const toggle = async (u: U) => {
    if (!db) return
    const isAdmin = admins.includes(u.id)
    if (!window.confirm(isAdmin ? `Remove admin access from ${u.name || u.id}?` : `Give ${u.name || u.id} full admin access?`)) return
    try {
      isAdmin ? await deleteDoc(doc(db, 'admins', u.id)) : await setDoc(doc(db, 'admins', u.id), { role: 'admin', grantedAt: serverTimestamp() })
      s.ok('Done.'); await load()
    } catch { s.fail('Could not change this account.') }
  }
  const q = filter.trim().toLowerCase()
  const shown = users.filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  return <section className="cv-card"><div className="cv-card-title">Members ({users.length})</div>
    <label className="cv-field"><span>Search</span><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Name or email" /></label>
    {shown.map(u => <div className="admin-row" key={u.id}><div className="admin-row-head"><strong>{u.name || 'Member'}{admins.includes(u.id) ? ' · admin' : ''}</strong>
      {u.id !== user?.uid && <button className="icon-btn" onClick={() => void toggle(u)}>{admins.includes(u.id) ? 'Remove admin' : 'Make admin'}</button>}</div>
      <small>{u.email || 'no email stored'} · {u.type} · joined {u.when.toLocaleDateString()}</small></div>)}
    <StatusLine status={s.status} /></section>
}
