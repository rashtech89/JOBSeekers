import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { findPost, telUrl, whatsappUrl } from '../lib/jobs'
import { relativeTime } from '../lib/format'
import { useLang } from '../i18n/LanguageContext'
import Disclaimer from '../components/Disclaimer'

export default function JobDetail() {
  const { id } = useParams()
  const { t, lang } = useLang()
  const post = findPost(id)
  if (!post) return <div className="content-page page-enter"><div className="empty-state"><h1>{t('job.notFound.title')}</h1><p>{t('job.notFound.desc')}</p><Link className="button button-primary" to="/jobs">{t('job.browse')}</Link></div></div>

  const titles = post.positions.map(p => p.title).join(' / ')
  const place = [post.city, post.country].filter(Boolean).join(', ') || t('job.locationUnknown')
  const subject = encodeURIComponent(titles)
  const hasContact = post.phones.length > 0 || post.emails.length > 0 || !!post.mapsUrl || !!post.applyUrl

  return <div className="content-page page-enter">
    <Link to="/jobs" className="back-link"><ArrowLeft size={16}/> {t('job.back')}</Link>
    <div className="detail-layout">
      <section className="detail-main">
        <div className="detail-title-row">
          <div className="company-mark company-mark-large">{(post.company ?? '?').slice(0, 1)}</div>
          <div><p className="eyebrow">{post.positions.length > 1 ? t('job.positions') : post.positions[0].category}</p><h1>{titles}</h1><p className="company-name">{post.company ?? t('job.companyUnknown')}</p></div>
        </div>
        <div className="detail-tags">
          <span><MapPin size={16}/>{place}</span>
          <span><CalendarDays size={16}/>{relativeTime(post.postedAt, lang)}</span>
          {post.tags.map(tag => <span key={tag}><CheckCircle2 size={16}/>{t(`tag.${tag}`)}</span>)}
        </div>

        <div className="detail-card poster-card">
          <h2>{t('job.poster')}</h2>
          <img className="poster-image" src={post.posterUrl} alt={`${titles}${post.company ? ` – ${post.company}` : ''}`} loading="lazy" />
        </div>

        {post.positions.map(pos => <div className="detail-card" key={pos.title}>
          <h2>{pos.title}{pos.subtitle ? <small className="pos-sub"> · {pos.subtitle}</small> : null}</h2>
          {pos.responsibilities && <><h3>{t('job.responsibilities')}</h3><ul>{pos.responsibilities.map(r => <li key={r}>{r}</li>)}</ul></>}
          <h3>{t('job.requirements')}</h3><ul>{pos.requirements.map(r => <li key={r}>{r}</li>)}</ul>
        </div>)}

        {post.generalRequirements && <div className="detail-card"><h2>{t('job.general')}</h2><ul>{post.generalRequirements.map(r => <li key={r}>{r}</li>)}</ul></div>}
        {post.howToApply && <div className="detail-card"><h2>{t('job.howToApply')}</h2><p>{post.howToApply}</p>
          <p className="notice"><ShieldCheck size={17}/> {t('job.verifyNote')}</p></div>}
        <Disclaimer />
      </section>

      <aside className="apply-card">
        <h2>{t('job.contact.title')}</h2><p>{t('job.contact.sub')}</p>
        {post.applyUrl && <a className="button button-primary full-button" href={post.applyUrl} target="_blank" rel="noreferrer noopener">{t('btn.apply')}</a>}
        {post.phones.map(ph => <div key={ph.number} className="contact-group">
          {ph.whatsapp && <a className="button button-whatsapp full-button" href={whatsappUrl(`${ph.dialCode}${ph.number}`)} target="_blank" rel="noreferrer noopener"><MessageCircle size={17}/> {t('btn.whatsapp')} · {ph.number}</a>}
          {ph.calls && <a className="button button-outline full-button" href={telUrl(ph)}><Phone size={17}/> {t('btn.call')} · {ph.number}</a>}
          {!ph.calls && <p className="small-note">{t('job.noCalls')}</p>}
        </div>)}
        {post.emails.map(em => <a key={em} className="button button-outline full-button" href={`mailto:${em}?subject=${subject}`}><Mail size={17}/> {t('btn.email')} · {em}</a>)}
        {post.mapsUrl && <a className="button button-outline full-button" href={post.mapsUrl} target="_blank" rel="noreferrer noopener"><MapPin size={17}/> {t('btn.map')}</a>}
        {!hasContact && <p className="notice">{t('job.noContact')}</p>}
        <p className="small-note">{t('job.verifiedNote')}</p>
      </aside>
    </div>
  </div>
}
