import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useLang } from '../i18n/LanguageContext'
import type { Lang } from '../i18n/translations'
import NotFound from './NotFound'
import { ArrowRight, Building2, UserRound } from 'lucide-react'

type Remote = { title: Partial<Record<Lang, string>>; body: Partial<Record<Lang, string>> }

export default function StaticPage() {
  const location = useLocation()
  const { slug: slugParam } = useParams()
  const { lang, t } = useLang()
  const path = location.pathname
  const slug = slugParam ?? path.replace(/^\//, '').split('/')[0]
  const [remote, setRemote] = useState<Remote | null | undefined>(undefined)
  useEffect(() => {
    setRemote(undefined)
    if (!db || !/^[a-z0-9-]{1,60}$/.test(slug)) { setRemote(null); return }
    let cancelled = false
    getDoc(doc(db, 'pages', slug)).then(snap => {
      if (cancelled) return
      const d = snap.data() as (Remote & { visible?: boolean }) | undefined
      setRemote(snap.exists() && d?.visible !== false ? d ?? null : null)
    }).catch(() => { if (!cancelled) setRemote(null) })
    return () => { cancelled = true }
  }, [slug])
  if (remote === undefined) return <div className="content-page"><p>{t('page.loading')}</p></div>
  if (remote) {
    const title = remote.title?.[lang] || remote.title?.en || ''
    const body = remote.body?.[lang] || remote.body?.en || ''
    return <div className="content-page page-enter"><div className="generic-card legal-page"><h1>{title}</h1>{body.split(/\n\s*\n/).map((p, i) => <p key={i} className="cv-text">{p}</p>)}</div></div>
  }
  if (slugParam) return <NotFound />
  const pages: Record<string,{title:string,desc:string}> = {
    '/companies': {title:'Discover companies',desc:'Explore employer profiles and the opportunities they share. Company data will be connected in a later backend phase.'},
    '/login': {title:'Welcome back',desc:'Secure sign-in will be connected to Firebase Authentication during backend implementation.'},
    '/register': {title:'Create your account',desc:'Choose a job seeker or employer account. Account creation is not enabled in this frontend prototype.'},
    '/employer': {title:'Employer workspace',desc:'Manage job posts, review activity, and prepare your company profile.'},
    '/contact': {title:'Contact us',desc:'Official contact details will be managed from the Admin Panel.'},
    '/help': {title:'Help center',desc:'Find guidance for job seekers and employers.'},
    '/safety': {title:'Job safety guidelines',desc:'Verify employers and job details before sending sensitive documents or paying any fee.'},
    '/privacy': {title:'Privacy policy',desc:'The final policy must describe the real data collected, purpose, retention and user rights before launch.'},
    '/terms': {title:'Terms of service',desc:'Terms will be reviewed and finalized before the production launch.'},
    '/cookies': {title:'Cookie policy',desc:'Cookie and analytics practices will be documented before launch.'},
  }
  const page = pages[path] || {title:'Page coming soon',desc:'This page is part of the planned multi-page Job Seekers portal.'}
  const Icon = path==='/companies'?Building2:UserRound
  return <div className="content-page page-enter"><div className="generic-card"><span className="generic-icon"><Icon size={27}/></span><p className="eyebrow">JOB SEEKERS</p><h1>{page.title}</h1><p>{page.desc}</p><div className="generic-actions"><Link className="button button-primary" to="/jobs">Explore jobs <ArrowRight size={16}/></Link><Link className="button button-outline" to="/">Back home</Link></div></div></div>
}
