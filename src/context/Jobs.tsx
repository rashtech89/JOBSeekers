import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { demoPosts, type Position, type PhoneContact, type Post, type PostTag } from '../lib/jobs'
import { toDate } from '../lib/social'

type Ctx = { posts: Post[]; loading: boolean; source: 'cloud' | 'demo'; refresh: () => Promise<void>; getPost: (id?: string) => Post | undefined }
const JobsContext = createContext<Ctx | null>(null)

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '')
const strs = (v: unknown, max = 40, len = 300) => (Array.isArray(v) ? v.slice(0, max).filter((x): x is string => typeof x === 'string').map(x => x.slice(0, len)) : [])
const TAGS: PostTag[] = ['inCountry', 'transferableResidency', 'article18', 'accommodation']

export function docToPost(id: string, d: Record<string, unknown>): Post {
  const positions: Position[] = (Array.isArray(d.positions) ? d.positions.slice(0, 20) : []).map(p => {
    const o = (p ?? {}) as Record<string, unknown>
    return { title: str(o.title, 120) || 'Job opportunity', subtitle: str(o.subtitle, 160) || undefined, category: str(o.category, 60) || 'General', responsibilities: strs(o.responsibilities), requirements: strs(o.requirements) }
  })
  const phones: PhoneContact[] = (Array.isArray(d.phones) ? d.phones.slice(0, 6) : []).map(p => {
    const o = (p ?? {}) as Record<string, unknown>
    return { number: str(o.number, 30), dialCode: str(o.dialCode, 6), calls: o.calls === true, whatsapp: o.whatsapp === true }
  }).filter(p => p.number)
  const status = (['draft', 'pending', 'published', 'expired', 'archived'] as string[]).includes(d.status as string) ? (d.status as Post['status']) : 'pending'
  return {
    id, company: str(d.company, 120) || undefined, countryCode: str(d.countryCode, 2) || undefined, city: str(d.city, 100) || undefined,
    posterId: str(d.posterId, 60) || undefined, hasPoster: d.hasPoster === true, posterUrl: '', positions: positions.length ? positions : [{ title: 'Job opportunity', category: 'General', requirements: [] }],
    generalRequirements: strs(d.generalRequirements), howToApply: str(d.howToApply, 1000) || undefined, phones, emails: strs(d.emails, 6, 120),
    mapsUrl: str(d.mapsUrl, 400) || undefined, applyUrl: str(d.applyUrl, 400) || undefined, tags: strs(d.tags, 8, 40).filter((t): t is PostTag => (TAGS as string[]).includes(t)),
    source: str(d.source, 20) || undefined, authorName: str(d.authorName, 80) || undefined, autoDetected: d.autoDetected === true,
    postedAt: toDate(d.postedAt).toISOString(), status,
  }
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(demoPosts)
  const [source, setSource] = useState<'cloud' | 'demo'>('demo')
  const [loading, setLoading] = useState(!!db)

  const refresh = useCallback(async () => {
    if (!db) { setLoading(false); return }
    try {
      const snap = await getDocs(query(collection(db, 'jobs'), where('status', 'in', ['published', 'expired']), limit(300)))
      if (snap.empty) { setPosts(demoPosts); setSource('demo') }
      else { setPosts(snap.docs.map(d => docToPost(d.id, d.data())).sort((a, b) => b.postedAt.localeCompare(a.postedAt))); setSource('cloud') }
    } catch { setPosts(demoPosts); setSource('demo') }
    setLoading(false)
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const getPost = useCallback((id?: string) => posts.find(p => p.id === id && (p.status === 'published' || p.status === 'expired')), [posts])
  const value = useMemo(() => ({ posts, loading, source, refresh, getPost }), [posts, loading, source, refresh, getPost])
  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}
export function useJobs() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs must be used inside JobsProvider')
  return ctx
}
