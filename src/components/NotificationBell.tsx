import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { toDate } from '../lib/social'
import { relativeTime } from '../lib/format'
import { useLang } from '../i18n/LanguageContext'

type Item = { id: string; type: string; fromName: string; read: boolean; createdAt: Date }
const TEXT: Record<string, string> = { connection_request: 'sent you a connection request', connection_accepted: 'accepted your connection request', message: 'sent you a message' }

export default function NotificationBell() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [open, setOpen] = useState(false)
  const uid = user?.uid
  useEffect(() => {
    if (!db || !uid) { setItems([]); return }
    return onSnapshot(query(collection(db, 'notifications', uid, 'items'), orderBy('createdAt', 'desc'), limit(20)), snap => {
      setItems(snap.docs.map(d => { const x = d.data() as Record<string, unknown>; return { id: d.id, type: String(x.type ?? ''), fromName: String(x.fromName ?? 'Someone'), read: x.read === true, createdAt: toDate(x.createdAt) } }))
    }, () => setItems([]))
  }, [uid])
  if (!uid) return null
  const unread = items.filter(i => !i.read).length
  const markRead = async (id: string) => { if (db) try { await updateDoc(doc(db, 'notifications', uid, 'items', id), { read: true }) } catch { /* ignore */ } }
  const openItem = async (i: Item) => { setOpen(false); await markRead(i.id); navigate(i.type === 'message' ? '/messages' : '/network') }
  const markAll = async () => { await Promise.all(items.filter(i => !i.read).map(i => markRead(i.id))) }
  return <div className="bell-wrap">
    <button className="icon-button bell-button" onClick={() => setOpen(o => !o)} aria-label={`Notifications${unread ? `, ${unread} new` : ''}`}><Bell size={18}/>{unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}</button>
    {open && <div className="bell-panel" role="dialog" aria-label="Notifications">
      <div className="bell-head"><strong>Notifications</strong>{unread > 0 && <button className="icon-btn" onClick={() => void markAll()}>Mark all read</button>}</div>
      {items.length === 0 && <p className="small-note">Nothing new yet.</p>}
      {items.map(i => <button key={i.id} className={i.read ? 'bell-item' : 'bell-item unread'} onClick={() => void openItem(i)}><span><strong>{i.fromName}</strong> {TEXT[i.type] ?? 'sent you an update'}</span><small>{relativeTime(i.createdAt.toISOString(), lang)}</small></button>)}
    </div>}
  </div>
}
