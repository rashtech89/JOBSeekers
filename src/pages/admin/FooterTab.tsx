import { useState } from 'react'
import { Save } from 'lucide-react'
import { useContent } from '../../context/Content'
import { footerFields, type FooterSettings } from '../../lib/siteContent'
import { AField, StatusLine, useStatus } from './ui'

const LABELS: Record<keyof FooterSettings, string> = {
  email: 'Contact email', phone: 'Phone (with country code)', whatsapp: 'WhatsApp number (with country code)', address: 'Address',
  facebook: 'Facebook link', instagram: 'Instagram link', tiktok: 'TikTok link', youtube: 'YouTube link', linkedin: 'LinkedIn link', x: 'X (Twitter) link',
  telegram: 'Telegram link', playStore: 'Google Play link', appStore: 'Apple App Store link',
}
const LINKS: (keyof FooterSettings)[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'telegram', 'playStore', 'appStore']

export default function FooterTab() {
  const { footer, save } = useContent()
  const [draft, setDraft] = useState<FooterSettings>(footer)
  const s = useStatus()
  const submit = async () => {
    for (const k of LINKS) if (draft[k].trim() && !/^https:\/\/\S+$/i.test(draft[k].trim())) return s.fail(`${LABELS[k]} must start with https://`)
    if (draft.email.trim() && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) return s.fail('Contact email is not valid.')
    const clean = Object.fromEntries(footerFields.map(k => [k, draft[k].trim()]))
    s.ok('Saving…'); const r = await save('footer', clean); r.ok ? s.ok('Footer saved. It is live for all visitors.') : s.fail(r.error || 'Could not save.')
  }
  return <section className="cv-card">
    <div className="cv-card-title">Footer, contact and social links</div>
    <p className="small-note">Anything left empty stays hidden on the website. Store buttons appear only when a link is added.</p>
    {footerFields.map(k => <AField key={k} label={LABELS[k]} value={draft[k]} onChange={v => setDraft(d => ({ ...d, [k]: v }))} placeholder={LINKS.includes(k) ? 'https://' : ''} />)}
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save footer</button>
    <StatusLine status={s.status} />
  </section>
}
