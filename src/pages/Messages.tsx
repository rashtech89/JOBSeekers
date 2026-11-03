import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { useConnections } from '../hooks/useConnections'
import { toDate } from '../lib/social'
import Avatar from '../components/Avatar'

type Msg = { id: string; from: string; text: string; createdAt: Date }

export default function Messages() {
  const { user, loading } = useAuth()
  const { items, otherName, otherUid, notify, uid } = useConnections()
  const [params, setParams] = useSearchParams()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const notified = useRef<Set<string>>(new Set())
  const friends = items.filter(c => c.status === 'accepted')
  const active = friends.find(c => c.id === params.get('with')) ?? friends[0]
  const activeId = active?.id

  useEffect(() => {
    if (!db || !activeId) { setMsgs([]); return }
    return onSnapshot(query(collection(db, 'chats', activeId, 'messages'), orderBy('createdAt', 'asc'), limit(200)), snap => {
      setMsgs(snap.docs.map(d => { const x = d.data() as Record<string, unknown>; return { id: d.id, from: String(x.from ?? ''), text: String(x.text ?? ''), createdAt: toDate(x.createdAt) } }))
    }, () => setMsgs([]))
  }, [activeId])

  if (loading) return <div className="content-page"><p>Loading…</p></div>
  if (!user) return <Navigate to="/login" replace />
  const send = async () => {
    const v = text.trim()
    if (!db || !active || !v || !uid) return
    setError('')
    try {
      await addDoc(collection(db, 'chats', active.id, 'messages'), { from: uid, text: v.slice(0, 1000), createdAt: serverTimestamp() })
      setText('')
      if (!notified.current.has(active.id)) { notified.current.add(active.id); void notify(otherUid(active), 'message') }
    } catch { setError('Could not send. Verify your email and make sure you are still connected.') }
  }

  return <div className="content-page page-enter"><div className="admin-shell">
    <div className="page-heading"><p className="eyebrow">MESSAGES</p><h1>Messages</h1><p>You can message people once they accept your connection request.</p></div>
    {friends.length === 0 ? <div className="empty-state"><p>No connections yet. <Link to="/network">Find people to connect with</Link>.</p></div> :
      <div className="chat-layout">
        <div className="chat-list">{friends.map(c => <button key={c.id} className={c.id === activeId ? 'chat-person active' : 'chat-person'} onClick={() => setParams({ with: c.id })}><Avatar name={otherName(c)} size={36} /><span>{otherName(c) || 'Member'}</span></button>)}</div>
        <div className="chat-window">
          <div className="chat-messages">{msgs.length === 0 && <p className="small-note">Say hello 👋</p>}
            {msgs.map(m => <p key={m.id} className={m.from === uid ? 'bubble mine' : 'bubble'}>{m.text}<small>{m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></p>)}</div>
          <div className="comment-form"><input value={text} maxLength={1000} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send() }} placeholder="Write a message" /><button className="button button-primary" onClick={() => void send()}>Send</button></div>
          {error && <p className="notice auth-error">{error}</p>}
          <p className="small-note">Never share bank details or pay money to someone you met here.</p>
        </div>
      </div>}
  </div></div>
}
