import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BriefcaseBusiness, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { allListings, jobTabs, tabOf, type JobTab } from '../lib/jobs'
import { relativeTime } from '../lib/format'
import { useLang } from '../i18n/LanguageContext'
import Disclaimer from '../components/Disclaimer'

export default function Jobs() {
  const [params] = useSearchParams()
  const { t, lang } = useLang()
  const [query, setQuery] = useState(params.get('q') || '')
  const [country, setCountry] = useState(params.get('country') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const initialTab = params.get('tab')
  const [tab, setTab] = useState<JobTab | 'all'>(jobTabs.includes(initialTab as JobTab) ? (initialTab as JobTab) : 'all')
  const filtered = useMemo(() => {
    const q = query.toLowerCase(), c = country.toLowerCase(), k = category.toLowerCase()
    return allListings.filter(({ post, position }) => {
      const place = `${post.city ?? ''} ${post.country ?? ''}`.toLowerCase()
      const text = `${position.title} ${position.subtitle ?? ''} ${post.company ?? ''} ${position.category} ${place}`.toLowerCase()
      return (tab === 'all' || tabOf(post) === tab) && text.includes(q) && (!c || place.includes(c)) && (!k || position.category.toLowerCase().includes(k))
    })
  }, [query, country, category, tab])

  return <div className="content-page page-enter">
    <div className="page-heading"><p className="eyebrow">{t('jobs.eyebrow')}</p><h1>{t('jobs.title')}</h1><p>{t('jobs.sub')}</p></div>
    <div className="filters-panel">
      <label><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('jobs.ph.query')}/></label>
      <label><MapPin size={18}/><input value={country} onChange={e => setCountry(e.target.value)} placeholder={t('jobs.ph.country')}/></label>
      <label><SlidersHorizontal size={18}/><input value={category} onChange={e => setCategory(e.target.value)} placeholder={t('jobs.ph.category')}/></label>
    </div>
    <div className="tab-row" role="tablist">{(['all', ...jobTabs] as (JobTab | 'all')[]).map(k => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab(k)}>{t(`tab.${k}`)}</button>)}</div>
    <p className="results-count">{t('jobs.count').replace('{n}', String(filtered.length))}</p>
    <div className="job-list">
      {filtered.map(({ key, post, position }) => <article className="job-list-card" key={key}>
        <div className="company-mark">{(post.company ?? '?').slice(0, 1)}</div>
        <div className="job-list-main">
          <h2><Link to={`/job/${post.id}`}>{position.title}</Link></h2>
          <p>{post.company ?? t('job.companyUnknown')}</p>
          <div className="job-meta">
            <span><MapPin size={15}/>{[post.city, post.country].filter(Boolean).join(', ') || t('job.locationUnknown')}</span>
            <span><BriefcaseBusiness size={15}/>{position.category}</span>
          </div>
          {position.subtitle && <p className="job-snippet">{position.subtitle}</p>}
        </div>
        <span className="job-type">{relativeTime(post.postedAt, lang)}</span>
      </article>)}
      {filtered.length === 0 && <div className="empty-state"><Search size={30}/><h3>{t('jobs.none.title')}</h3><p>{t('jobs.none.desc')}</p></div>}
    </div>
    <Disclaimer />
  </div>
}
