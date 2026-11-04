import { useMemo, useState } from 'react'
import { Link2, Mail, MapPin, MessageCircle, Phone, Send, Share2 } from 'lucide-react'
import { contactActions, postTitles, type ContactAction } from '../lib/contacts'
import type { Post } from '../lib/jobs'
import { useLang } from '../i18n/LanguageContext'
import { useSiteSettings } from '../context/SiteSettings'

const ICON = { whatsapp: MessageCircle, call: Phone, email: Mail, link: Link2, map: MapPin } as const

function launch(href: string) {
  if (/^https:/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer')
  else window.location.href = href
}

/** Apply + Share buttons shown under a poster. Apply opens the WhatsApp / phone / email / link found on the post. */
export default function ApplyBar({ post, defaultOpen = false }: { post: Post; defaultOpen?: boolean }) {
  const { t } = useLang()
  const { settings } = useSiteSettings()
  const [open, setOpen] = useState(defaultOpen)
  const [note, setNote] = useState('')
  const actions = useMemo(() => contactActions(post), [post])
  const label = (a: ContactAction) => a.kind === 'whatsapp' ? t('btn.whatsapp') : a.kind === 'call' ? t('btn.call') : a.kind === 'email' ? t('btn.email') : a.kind === 'map' ? t('btn.map') : t('btn.apply')

  const apply = () => {
    setNote('')
    if (actions.length === 1) { launch(actions[0].href); return }
    setOpen(o => !o)
  }
  const share = async () => {
    const url = new URL(`${import.meta.env.BASE_URL}job/${post.id}`, window.location.origin).href
    const title = postTitles(post) || `${settings.siteName}: ${t('post.shareTitle')}`
    try {
      if (navigator.share) { await navigator.share({ title, text: title, url }); return }
      await navigator.clipboard.writeText(url); setNote(t('post.linkCopied'))
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setNote(url)
    }
  }

  return <div className="apply-wrap">
    <div className="apply-bar">
      <button type="button" className="button button-primary" onClick={apply}><Send size={16}/> {t('btn.apply')}</button>
      <button type="button" className="button button-outline" onClick={() => void share()}><Share2 size={16}/> {t('btn.share')}</button>
    </div>
    {note && <p className="small-note" role="status">{note}</p>}
    {open && <div className="contact-sheet">
      {actions.length === 0 && <p className="notice">{t('post.noContact')}</p>}
      {actions.map((a, i) => { const Icon = ICON[a.kind]; return <a key={`${a.kind}-${i}`} className={a.kind === 'whatsapp' ? 'button button-whatsapp full-button' : 'button button-outline full-button'} href={a.href} target={/^https:/i.test(a.href) ? '_blank' : undefined} rel="noreferrer noopener"><Icon size={17}/> {label(a)}{a.detail ? ` · ${a.detail}` : ''}</a> })}
      {post.phones.some(p => !p.calls) && actions.length > 0 && <p className="small-note">{t('job.noCalls')}</p>}
    </div>}
  </div>
}
