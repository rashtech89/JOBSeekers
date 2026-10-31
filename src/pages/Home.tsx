import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2, Globe2, Search, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { allListings, jobTabs, tabOf, type JobTab } from '../lib/jobs'
import { relativeTime } from '../lib/format'
import { useLang } from '../i18n/LanguageContext'
import { useSiteSettings } from '../context/SiteSettings'

export default function Home() {
  const { settings } = useSiteSettings()
  const { t, lang } = useLang()
  const [tab, setTab] = useState<JobTab>('latest')
  const tabListings = allListings.filter(l => tabOf(l.post) === tab)
  return <div className="page-enter">
    <section className="hero" style={settings.headerCover ? { backgroundImage: `linear-gradient(90deg, rgba(8,47,44,.92), rgba(8,47,44,.55)), url(${settings.headerCover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
      <div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/>
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={15}/> {t('home.eyebrow')}</div>
        <h1>{t('home.h1a')}<br/><span>{t('home.h1b')}</span></h1>
        <p className="hero-description">{t('home.desc')}</p>
        <form className="hero-search" action="/jobs">
          <label><Search size={19}/><input name="q" placeholder={t('jobs.ph.query')}/></label>
          <label><Globe2 size={19}/><input name="country" placeholder={t('jobs.ph.country')}/></label>
          <button className="button button-primary" type="submit">{t('home.search')} <ArrowRight size={17}/></button>
        </form>
        <div className="hero-meta"><span><ShieldCheck size={16}/> Job details you can review</span><span><Globe2 size={16}/> Global opportunities</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustrative job search dashboard">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="floating-card floating-card-main">
          <div className="mini-card-top"><span className="mini-logo">JS</span><span className="status-pill"><i/> New opportunity</span></div>
          <p className="mini-label">YOUR NEXT ROLE</p><h3>Make your next move.</h3><p className="mini-muted">Discover roles that fit your goals.</p>
          <div className="mini-progress"><span/></div><div className="mini-card-foot"><span>Explore jobs</span><ArrowUpRight size={17}/></div>
        </div>
        <div className="floating-card floating-card-small"><div className="round-icon"><BriefcaseBusiness size={19}/></div><div><strong>Fresh opportunities</strong><small>Across industries</small></div></div>
        <div className="floating-card floating-card-stat"><span className="stat-dot"/><strong>Global reach</strong><small>One place to search</small></div>
        <div className="visual-sphere"><div className="sphere-inner"/></div>
      </div>
    </section>
    <section className="trust-strip"><span><Users size={18}/> For job seekers</span><span><Building2 size={18}/> For employers</span><span><Globe2 size={18}/> Across borders</span><span><ShieldCheck size={18}/> Safety-first design</span></section>
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">{t('home.start')}</p><h2>{t('home.explore')}</h2><p className="section-subtitle">{t('home.explore.sub')}</p></div><Link className="text-link" to="/jobs">{t('home.browseAll')} <ArrowRight size={16}/></Link></div>
      <div className="category-grid">{['Administration','Marketing','Driving','Healthcare','Construction','Technology'].map((item, i) => <Link className="category-card" to={`/jobs?category=${encodeURIComponent(item)}`} key={item}><span className={`category-icon icon-${i}`}><BriefcaseBusiness size={20}/></span><strong>{item}</strong><span>Explore roles <ArrowUpRight size={15}/></span></Link>)}</div>
    </section>
    <section className="section-block latest-section">
      <div className="section-heading"><div><p className="eyebrow">{t('home.recent')}</p><h2>{t('home.recent.title')}</h2><p className="section-subtitle">{t('home.recent.sub')}</p></div><Link className="text-link" to={`/jobs?tab=${tab}`}>{t('home.viewAll')} <ArrowRight size={16}/></Link></div>
      <div className="tab-row" role="tablist">{jobTabs.map(k => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab(k)}>{t(`tab.${k}`)}</button>)}</div>
        {tabListings.length === 0 && <div className="empty-state"><p>{t('tab.empty')}</p></div>}
        <div className="job-grid">{tabListings.slice(0, 6).map(({ key, post, position }) => <article className="job-card" key={key}><div className="job-card-head"><div className="company-mark">{(post.company ?? '?').slice(0,1)}</div><span className="job-type">{position.category}</span></div><h3><Link to={`/job/${post.id}`}>{position.title}</Link></h3><p className="company-name">{post.company ?? t('job.companyUnknown')}</p><div className="job-meta"><span><Globe2 size={15}/>{[post.city, post.country].filter(Boolean).join(', ') || t('job.locationUnknown')}</span></div><div className="job-card-bottom"><span>{relativeTime(post.postedAt, lang)}</span><Link to={`/job/${post.id}`} aria-label={position.title}><ArrowUpRight size={18}/></Link></div></article>)}</div>
    </section>
    <section className="employer-cta"><div><p className="eyebrow">FOR EMPLOYERS</p><h2>Find the people who move your business forward.</h2><p>Upload a job poster, add details when you need them, and manage your listings in one place.</p></div><Link to="/employer/upload" className="button button-light">Post a job <ArrowRight size={17}/></Link></section>
  </div>
}
