import { useCallback, useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { pairId } from '../lib/social'

export type Connection = { id: string; users: string[]; from: string; to: string; fromName: string; toName: string; status: 'pending' | 'accepted' }

export function useConnections() {
  const { user } = useAuth()
  const [items, setItems] = useState<Connection[]>([])
  const uid = user?.uid
  useEffect(() => {
    if (!db || !uid) { setItems([]); return }
    return onSnapshot(query(collection(db, 'connections'), where('users', 'array-contains', uid)), snap => {
      setItems(snap.docs.map(d => {
        const x = d.data() as Record<string, unknown>
        return { id: d.id, users: (x.users as string[]) ?? [], from: String(x.from ?? ''), to: String(x.to ?? ''), fromName: String(x.fromName ?? ''), toName: String(x.toName ?? ''), status: x.status === 'accepted' ? 'accepted' : 'pending' }
      }))
    }, () => setItems([]))
  }, [uid])

  const notify = useCallback(async (toUid: string, type: 'connection_request' | 'connection_accepted' | 'message') => {
    if (!db || !user) return
    try { await addDoc(collection(db, 'notifications', toUid, 'items'), { type, from: user.uid, fromName: (user.displayName || 'Someone').slice(0, 80), read: false, createdAt: serverTimestamp() }) } catch { /* notification is optional */ }
  }, [user])

  const connect = useCallback(async (otherUid: string, otherName: string) => {
    if (!db || !user) return
    await setDoc(doc(db, 'connections', pairId(user.uid, otherUid)), {
      users: [user.uid, otherUid], from: user.uid, to: otherUid, fromName: (user.displayName || 'Member').slice(0, 80), toName: otherName.slice(0, 80), status: 'pending', createdAt: serverTimestamp(),
    })
    await notify(otherUid, 'connection_request')
  }, [user, notify])
  const accept = useCallback(async (c: Connection) => {
    if (!db) return
    await updateDoc(doc(db, 'connections', c.id), { status: 'accepted' })
    await notify(c.from, 'connection_accepted')
  }, [notify])
  const remove = useCallback(async (id: string) => { if (db) await deleteDoc(doc(db, 'connections', id)) }, [])
  const otherUid = (c: Connection) => c.users.find(u => u !== uid) ?? ''
  const otherName = (c: Connection) => (c.from === uid ? c.toName : c.fromName)
  return { items, connect, accept, remove, notify, otherUid, otherName, uid }
}
