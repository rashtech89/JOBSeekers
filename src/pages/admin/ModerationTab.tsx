import { useCallback, useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { toDate } from '../../lib/social'
import { StatusLine, useStatus } from './ui'

type Report = { id: string; postId: string; reason: string; when: Date }
type Post = { id: string; author: string; text: string; reported: boolean }

export default function ModerationTab() {
  const [reports, setReports] = useState<Report[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const s = useStatus()
  const load = useCallback(async () => {
    if (!db) return
    try {
      const r = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(40)))
      const rep = r.docs.map(d => { const x = d.data() as Record<string, unknown>; return { id: d.id, postId: String(x.postId ?? ''), reason: String(x.reason ?? ''), when: toDate(x.createdAt) } })
      setReports(rep)
      const p = await getDocs(query(collection(db, 'feed'), orderBy('createdAt', 'desc'), limit(40)))
      setPosts(p.docs.map(d => { const x = d.data() as Record<string, unknown>; return { id: d.id, author: String(x.authorName ?? ''), text: String(x.text ?? '').slice(0, 300), reported: rep.some(q => q.postId === d.id) } }))
    } catch { s.fail('Could not load. Publish the latest firestore.rules and check your admin account.') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { void load() }, [load])

  const delPost = async (id: string) => { if (!db || !window.confirm('Delete this post?')) return; try { await deleteDoc(doc(db, 'feed', id)); s.ok('Post deleted.'); await load() } catch { s.fail('Could not delete.') } }
  const delReport = async (id: string) => { if (!db) return; try { await deleteDoc(doc(db, 'reports', id)); await load() } catch { s.fail('Could not remove the report.') } }

  return <div className="admin-shell">
    <section className="cv-card"><div className="cv-card-title">Reports from members ({reports.length})</div>
      {reports.length === 0 && <p className="small-note">No reports.</p>}
      {reports.map(r => <div className="admin-row" key={r.id}><small>{r.when.toLocaleString()} · post {r.postId}</small><div>{r.reason}</div>
        <div className="admin-checks"><button className="icon-btn" onClick={() => void delPost(r.postId)}>Delete the post</button><button className="icon-btn" onClick={() => void delReport(r.id)}>Dismiss report</button></div></div>)}
    </section>
    <section className="cv-card"><div className="cv-card-title">Latest feed posts</div>
      {posts.length === 0 && <p className="small-note">No posts yet.</p>}
      {posts.map(p => <div className="admin-row" key={p.id}><div className="admin-row-head"><strong>{p.author || 'Member'}{p.reported ? ' · reported' : ''}</strong><button className="icon-btn" onClick={() => void delPost(p.id)}>Delete</button></div><div className="small-note">{p.text}</div></div>)}
      <StatusLine status={s.status} /></section>
  </div>
}
