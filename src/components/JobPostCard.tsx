import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
import { postPlace, type Post } from '../lib/jobs'
import { postTitles } from '../lib/contacts'
import { loadPoster } from '../lib/posters'
import { useLang } from '../i18n/LanguageContext'
import { useSiteSettings } from '../context/SiteSettings'
import Avatar from './Avatar'
import ApplyBar from './ApplyBar'

/** Loads the poster picture only when the card is about to be seen. */
export function PosterImage({ post, link = true }: { post: Post; link?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState(post.posterUrl || '')
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (src || !post.hasPoster || !ref.current) return
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setNear(true); io.disconnect() } }, { rootMargin: '500px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [src, post.hasPoster])
  useEffect(() => {
    if (!near || src) return
    let cancelled = false
    void loadPoster(post.posterId || post.id).then(s => { if (!cancelled) setSrc(s) })
    return () => { cancelled = true }
  }, [near, src, post.posterId, post.id])
  if (!src && !post.hasPoster) return null
  const img = src ? <img className="post-poster-img" src={src} alt={postTitles(post) || 'Job poster'} loading="lazy" /> : <div className="post-poster-skel" aria-hidden="true" />
  return <div ref={ref} className="post-poster">{link && src ? <Link to={`/job/${post.id}`}>{img}</Link> : img}</div>
}

/** Poster-owner line above a post: who shared it, where, and when (like a social post). */
export function PostHeader({ post }: { post: Post }) {
  const { t, lang } = useLang()
  const { settings } = useSiteSettings()
  const byMember = post.source === 'user' && !!post.authorName
  const author = byMember ? (post.authorName as string) : t('post.panel')
  const when = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(post.postedAt))
  const place = postPlace(post, lang)
  return <div className="post-head">
    <Avatar name={byMember ? author : settings.siteName} photo={byMember ? undefined : settings.logo || undefined} size={44} />
    <div><strong>{author}</strong><small>{[place, when].filter(Boolean).join(' · ')}</small></div>
  </div>
}

export default function JobPostCard({ post }: { post: Post }) {
  const { t } = useLang()
  const titles = postTitles(post)
  const hasPoster = post.hasPoster || !!post.posterUrl
  const lines = post.positions.flatMap(p => p.requirements).slice(0, 3)
  return <article className="post-card">
    <PostHeader post={post} />
    {(titles || post.company) && <div className="post-text">
      {titles && <h3><Link to={`/job/${post.id}`}>{titles}</Link></h3>}
      {post.company && <p className="company-name"><Building2 size={14}/> {post.company}</p>}
      {!hasPoster && lines.length > 0 && <ul>{lines.map(l => <li key={l}>{l}</li>)}</ul>}
    </div>}
    <PosterImage post={post} />
    {!hasPoster && !titles && !post.company && <p className="post-text"><MapPin size={14}/> {t('job.locationUnknown')}</p>}
    <ApplyBar post={post} />
  </article>
}
