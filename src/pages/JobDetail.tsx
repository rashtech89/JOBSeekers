import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useJobs } from '../context/Jobs'
import { useLang } from '../i18n/LanguageContext'
import { isPlaceholderTitle, postTitles } from '../lib/contacts'
import Disclaimer from '../components/Disclaimer'
import ApplyBar from '../components/ApplyBar'
import { PostHeader, PosterImage } from '../components/JobPostCard'

export default function JobDetail() {
  const { id } = useParams()
  const { t } = useLang()
  const { getPost, loading } = useJobs()
  const post = getPost(id)
  if (!post && loading) return <div className="content-page"><p>{t('page.loading')}</p></div>
  if (!post) return <div className="content-page page-enter"><div className="empty-state"><h1>{t('job.notFound.title')}</h1><p>{t('job.notFound.desc')}</p><Link className="button button-primary" to="/jobs">{t('job.browse')}</Link></div></div>

  const titles = postTitles(post)
  // Only positions that have something real to show (a real title or lists) get a card; empty headings are never shown.
  const positions = post.positions.filter(p => !isPlaceholderTitle(p.title) || p.requirements.length > 0 || (p.responsibilities?.length ?? 0) > 0)
  const general = post.generalRequirements ?? []

  return <div className="content-page page-enter">
    <Link to="/jobs" className="back-link"><ArrowLeft size={16}/> {t('job.back')}</Link>
    <div className="post-detail">
      <article className="post-card">
        <PostHeader post={post} />
        {(titles || post.company) && <div className="post-text">
          {titles && <h1 className="post-title">{titles}</h1>}
          {post.company && <p className="company-name">{post.company}</p>}
        </div>}
        <PosterImage post={post} link={false} />
        <ApplyBar post={post} defaultOpen />
        {post.tags.length > 0 && <div className="detail-tags">{post.tags.map(tag => <span key={tag}><CheckCircle2 size={16}/>{t(`tag.${tag}`)}</span>)}</div>}
      </article>

      {positions.map(pos => <div className="detail-card" key={pos.title + pos.category}>
        {!isPlaceholderTitle(pos.title) && <h2>{pos.title}{pos.subtitle ? <small className="pos-sub"> · {pos.subtitle}</small> : null}</h2>}
        {pos.responsibilities && pos.responsibilities.length > 0 && <><h3>{t('job.responsibilities')}</h3><ul>{pos.responsibilities.map(r => <li key={r}>{r}</li>)}</ul></>}
        {pos.requirements.length > 0 && <><h3>{t('job.requirements')}</h3><ul>{pos.requirements.map(r => <li key={r}>{r}</li>)}</ul></>}
      </div>)}
      {general.length > 0 && <div className="detail-card"><h2>{t('job.general')}</h2><ul>{general.map(r => <li key={r}>{r}</li>)}</ul></div>}
      {post.howToApply && <div className="detail-card"><h2>{t('job.howToApply')}</h2><p>{post.howToApply}</p></div>}
      <p className="notice"><ShieldCheck size={17}/> {t('job.verifyNote')}</p>
      <Disclaimer />
    </div>
  </div>
}
