import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BriefcaseBusiness, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { inCountry, jobTabs, listingsFrom, postPlace, tabOf, type JobTab } from '../lib/jobs'
import { relativeTime } from '../lib/format'
import { useLang } from '../i18n/LanguageContext'
import { useJobs } from '../context/Jobs'
import { useCountry } from '../context/Country'
import { countryName } from '../lib/countries'
import Disclaimer from '../components/Disclaimer'

export default function Jobs() {
  const [params] = useSearchParams()
  const { t, lang } = useLang()
  const { posts, loading } = useJobs()
  const { country } = useCountry()
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const initialTab = params.get('tab')
  const [tab, setTab] = useState<JobTab | 'all'>(jobTabs.includes(initialTab as JobTab) ? (initialTab as JobTab) : 'all')
  const filtered = useMemo(() => {
    const q = query.toLowerCase(), k = category.toLowerCase()
    return listingsFrom(posts).filter(({ post, position }) => {
      if (!inCountry(post, country)) return false
      const text = `${position.title} ${position.subtitle ?? ''} ${post.company ?? ''} ${position.category} ${postPlace(post, lang)}`.toLowerCase()
      return (tab === 'all' || tabOf(post) === tab) && text.includes(q) && (!k || position.category.toLowerCase().includes(k))
    })
  }, [posts, query, category, tab, country, lang])

  return <div className="content-page page-enter">
    <div className="page-heading"><p className="eyebrow">{t('jobs.eyebrow')}</p><h1>{t('jobs.title')}</h1><p>{t('jobs.sub')}{country ? ` · ${countryName(country, lang)}` : ''}</p></div>
    <div className="filters-panel">
      <label><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('jobs.ph.query')}/></label>
      <label><SlidersHorizontal size={18}/><input value={category} onChange={e => setCategory(e.target.value)} placeholder={t('jobs.ph.category')}/></label>
    </div>
    <div className="tab-row" role="tablist">{(['all', ...jobTabs] as (JobTab | 'all')[]).map(k => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab(k)}>{t(`tab.${k}`)}</button>)}</div>
    <p className="results-count">{loading ? t('page.loading') : t('jobs.count').replace('{n}', String(filtered.length))}</p>
    <div className="job-list">
      {filtered.map(({ key, post, position }) => <article className="job-list-card" key={key}>
        <div className="company-mark">{(post.company ?? '?').slice(0, 1)}</div>
        <div className="job-list-main">
          <h2><Link to={`/job/${post.id}`}>{position.title}</Link></h2>
          <p>{post.company ?? t('job.companyUnknown')}</p>
          <div className="job-meta"><span><MapPin size={15}/>{postPlace(post, lang) || t('job.locationUnknown')}</span><span><BriefcaseBusiness size={15}/>{position.category}</span></div>
          {position.subtitle && <p className="job-snippet">{position.subtitle}</p>}
        </div>
        <span className="job-type">{relativeTime(post.postedAt, lang)}</span>
      </article>)}
      {!loading && filtered.length === 0 && <div className="empty-state"><Search size={30}/><h3>{t('jobs.none.title')}</h3><p>{t('jobs.none.desc')}</p></div>}
    </div>
    <Disclaimer />
  </div>
}
