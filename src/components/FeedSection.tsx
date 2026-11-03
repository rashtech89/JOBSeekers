import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { Flag, Heart, ImagePlus, MessageCircle, Trash2 } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { useLang } from '../i18n/LanguageContext'
import { useProfile } from '../hooks/useProfile'
import { compressImage } from '../lib/images'
import { relativeTime } from '../lib/format'
import { toDate } from '../lib/social'
import Avatar from './Avatar'

type FeedPost = { id: string; authorId: string; authorName: string; authorHeadline: string; text: string; image: string; createdAt: Date }
type Comment = { id: string; authorId: string; authorName: string; text: string; createdAt: Date }

function PostItem({ post }: { post: FeedPost }) {
  const { user, isAdmin } = useAuth()
  const { lang } = useLang()
  const [likes, setLikes] = useState<string[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => {
    if (!db) return
    return onSnapshot(collection(db, 'feed', post.id, 'likes'), s => setLikes(s.docs.map(d => d.id)), () => setLikes([]))
  }, [post.id])
  useEffect(() => {
    if (!db || !showComments) return
    return onSnapshot(query(collection(db, 'feed', post.id, 'comments'), orderBy('createdAt', 'asc'), limit(50)), s => setComments(s.docs.map(d => {
      const x = d.data() as Record<string, unknown>
      return { id: d.id, authorId: String(x.authorId ?? ''), authorName: String(x.authorName ?? ''), text: String(x.text ?? ''), createdAt: toDate(x.createdAt) }
    })), () => setComments([]))
  }, [post.id, showComments])

  const liked = !!user && likes.includes(user.uid)
  const toggleLike = async () => {
    if (!db || !user) return setNote('Sign in to like posts.')
    try { liked ? await deleteDoc(doc(db, 'feed', post.id, 'likes', user.uid)) : await setDoc(doc(db, 'feed', post.id, 'likes', user.uid), { createdAt: serverTimestamp() }) } catch { setNote('Verify your email to like posts.') }
  }
  const sendComment = async () => {
    const v = text.trim()
    if (!db || !user || !v) return
    try { await addDoc(collection(db, 'feed', post.id, 'comments'), { authorId: user.uid, authorName: (user.displayName || 'Member').slice(0, 80), text: v.slice(0, 300), createdAt: serverTimestamp() }); setText('') } catch { setNote('Verify your email to comment.') }
  }
  const report = async () => {
    if (!db || !user) return setNote('Sign in to report a post.')
    try { await addDoc(collection(db, 'reports'), { postId: post.id, reporterId: user.uid, reason: 'Reported by a member', createdAt: serverTimestamp() }); setNote('Thank you. The admin team will review this post.') } catch { setNote('Could not send the report.') }
  }
  const remove = async () => { if (db && window.confirm('Delete this post?')) try { await deleteDoc(doc(db, 'feed', post.id)) } catch { setNote('Could not delete.') } }
  const mine = user?.uid === post.authorId

  return <article className="feed-post">
    <header>
      <Avatar name={post.authorName} size={44} />
      <div>{user ? <Link to={`/u/${post.authorId}`} className="person-name">{post.authorName}</Link> : <strong>{post.authorName}</strong>}
        <small>{post.authorHeadline}</small><small>{relativeTime(post.createdAt.toISOString(), lang)}</small></div>
    </header>
    {post.text && <p className="feed-text">{post.text}</p>}
    {post.image && <img className="feed-image" src={post.image} alt="" loading="lazy" />}
    <footer>
      <button className={liked ? 'icon-btn liked' : 'icon-btn'} onClick={() => void toggleLike()}><Heart size={16}/> {likes.length}</button>
      <button className="icon-btn" onClick={() => setShowComments(s => !s)}><MessageCircle size={16}/> Comments</button>
      {!mine && <button className="icon-btn" onClick={() => void report()}><Flag size={16}/> Report</button>}
      {(mine || isAdmin) && <button className="icon-btn" onClick={() => void remove()}><Trash2 size={16}/> Delete</button>}
    </footer>
    {note && <p className="small-note">{note}</p>}
    {showComments && <div className="feed-comments">
      {comments.map(c => <p key={c.id}><strong>{c.authorName}</strong> {c.text}</p>)}
      {user ? <div className="comment-form"><input value={text} maxLength={300} onChange={e => setText(e.target.value)} placeholder="Write a comment" /><button className="button button-outline" onClick={() => void sendComment()}>Send</button></div> : <p className="small-note"><Link to="/login">Sign in</Link> to comment.</p>}
    </div>}
  </article>
}

export default function FeedSection() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.uid, user?.displayName ?? '')
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [text, setText] = useState('')
  const [image, setImage] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!db) return
    return onSnapshot(query(collection(db, 'feed'), orderBy('createdAt', 'desc'), limit(20)), snap => {
      setPosts(snap.docs.map(d => {
        const x = d.data() as Record<string, unknown>
        return { id: d.id, authorId: String(x.authorId ?? ''), authorName: String(x.authorName ?? 'Member'), authorHeadline: String(x.authorHeadline ?? ''), text: String(x.text ?? ''), image: String(x.image ?? ''), createdAt: toDate(x.createdAt) }
      }))
    }, () => setPosts([]))
  }, [])

  const pickImage = async (file?: File) => {
    if (!file) return
    try { setImage(await compressImage(file, 1200, 'image/jpeg', 280_000)); setMsg('') } catch (e) { setMsg((e as Error).message) }
  }
  const publish = async () => {
    if (!db || !user) return
    if (!text.trim() && !image) return setMsg('Write something or add a photo.')
    setBusy(true); setMsg('')
    try {
      await addDoc(collection(db, 'feed'), { authorId: user.uid, authorName: (user.displayName || 'Member').slice(0, 80), authorHeadline: (profile?.headline || '').slice(0, 200), text: text.trim().slice(0, 1000), image, createdAt: serverTimestamp() })
      setText(''); setImage(''); if (fileRef.current) fileRef.current.value = ''
    } catch (e) { setMsg((e as { code?: string }).code === 'permission-denied' ? 'Posting needs a verified email. Verify it from My account, then try again.' : 'Could not post. Try again.') }
    setBusy(false)
  }

  return <section className="section-block feed-section">
    <div className="section-heading"><div><p className="eyebrow">COMMUNITY</p><h2>News feed</h2><p className="section-subtitle">Share updates, job leads and advice with the community.</p></div></div>
    <div className="feed-layout">
      <div className="feed-main">
        {user ? <div className="feed-composer">
          <textarea rows={3} maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder="Share an update or a job lead…" />
          {image && <img className="feed-image" src={image} alt="Selected" />}
          <div className="feed-composer-actions">
            <label className="button button-outline"><ImagePlus size={16}/> Photo<input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { void pickImage(e.target.files?.[0]) }} /></label>
            {image && <button className="button button-outline" onClick={() => { setImage(''); if (fileRef.current) fileRef.current.value = '' }}>Remove photo</button>}
            <button className="button button-primary" disabled={busy} onClick={() => void publish()}>Post</button>
          </div>
          {msg && <p className="small-note">{msg}</p>}
        </div> : <p className="notice"><Link to="/login">Sign in</Link> or <Link to="/register">create an account</Link> to post, like and comment.</p>}
        {posts.length === 0 && <div className="empty-state"><p>No posts yet. Be the first to share something.</p></div>}
        {posts.map(p => <PostItem key={p.id} post={p} />)}
      </div>
    </div>
  </section>
}
