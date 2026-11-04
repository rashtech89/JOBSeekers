import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { inCountry, jobTabs, postPlace, tabOf, type JobTab } from '../lib/jobs'
import { useLang } from '../i18n/LanguageContext'
import { useJobs } from '../context/Jobs'
import { useCountry } from '../context/Country'
import { countryName } from '../lib/countries'
import Disclaimer from '../components/Disclaimer'
import JobPostCard from '../components/JobPostCard'

const PAGE = 8

export default function Jobs() {
  const [params] = useSearchParams()
  const { t, lang } = useLang()
  const { posts, loading } = useJobs()
  const { country } = useCountry()
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const initialTab = params.get('tab')
  const [tab, setTab] = useState<JobTab | 'all'>(jobTabs.includes(initialTab as JobTab) ? (initialTab as JobTab) : 'all')
  const [shown, setShown] = useState(PAGE)
  const filtered = useMemo(() => {
    const q = query.toLowerCase(), k = category.toLowerCase()
    return posts.filter(post => {
      if (post.status !== 'published' && post.status !== 'expired') return false
      if (!inCountry(post, country)) return false
      if (tab !== 'all' && tabOf(post) !== tab) return false
      const text = `${post.positions.map(p => `${p.title} ${p.subtitle ?? ''}`).join(' ')} ${post.company ?? ''} ${postPlace(post, lang)}`.toLowerCase()
      return text.includes(q) && (!k || post.positions.some(p => p.category.toLowerCase().includes(k)))
    })
  }, [posts, query, category, tab, country, lang])

  return <div className="content-page page-enter">
    <div className="page-heading"><p className="eyebrow">{t('jobs.eyebrow')}</p><h1>{t('jobs.title')}</h1><p>{t('jobs.sub')}{country ? ` · ${countryName(country, lang)}` : ''}</p></div>
    <div className="filters-panel">
      <label><Search size={18}/><input value={query} onChange={e => { setQuery(e.target.value); setShown(PAGE) }} placeholder={t('jobs.ph.query')}/></label>
      <label><SlidersHorizontal size={18}/><input value={category} onChange={e => { setCategory(e.target.value); setShown(PAGE) }} placeholder={t('jobs.ph.category')}/></label>
    </div>
    <div className="tab-row" role="tablist">{(['all', ...jobTabs] as (JobTab | 'all')[]).map(k => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'tab-btn active' : 'tab-btn'} onClick={() => { setTab(k); setShown(PAGE) }}>{t(`tab.${k}`)}</button>)}</div>
    <p className="results-count">{loading ? t('page.loading') : t('jobs.count').replace('{n}', String(filtered.length))}</p>
    <div className="post-feed">
      {filtered.slice(0, shown).map(post => <JobPostCard key={post.id} post={post} />)}
      {!loading && filtered.length === 0 && <div className="empty-state"><Search size={30}/><h3>{t('jobs.none.title')}</h3><p>{t('jobs.none.desc')}</p></div>}
    </div>
    {filtered.length > shown && <div className="load-more"><button className="button button-outline" onClick={() => setShown(n => n + PAGE)}>{t('post.loadMore')}</button></div>}
    <Disclaimer />
  </div>
}
