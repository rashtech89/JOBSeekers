import { whatsappUrl, type PhoneContact, type Post } from './jobs'

const DIAL: Record<string, string> = {
  KW: '965', SA: '966', AE: '971', QA: '974', BH: '973', OM: '968', BD: '880', IN: '91', PK: '92', LK: '94', NP: '977', PH: '63', ID: '62',
  EG: '20', JO: '962', LB: '961', IQ: '964', YE: '967', SY: '963', TR: '90', US: '1', CA: '1', GB: '44', DE: '49', FR: '33', IT: '39',
  ES: '34', MY: '60', SG: '65', CN: '86', JP: '81', KR: '82', AU: '61', ZA: '27', NG: '234', KE: '254', ET: '251', SD: '249', MA: '212',
  TN: '216', DZ: '213', LY: '218',
}
export const dialCodeFor = (countryCode?: string): string => (countryCode ? DIAL[countryCode.toUpperCase()] ?? '' : '')
/** Calling codes, longest first, used to split "+965 5538 1115" into code and number. */
export const KNOWN_DIAL_CODES = Array.from(new Set(Object.values(DIAL))).sort((a, b) => b.length - a.length)

/** Digits-only international number for wa.me / tel: links. Returns "" when it cannot be built safely. */
export function intlNumber(ph: PhoneContact, countryCode?: string): string {
  const raw = ph.number.trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (raw.startsWith('+')) return digits
  if (raw.startsWith('00')) return digits.slice(2)
  const dial = (ph.dialCode || dialCodeFor(countryCode)).replace(/\D/g, '')
  if (dial && digits.startsWith(dial) && digits.length > 10) return digits
  return (dial ? dial : '') + digits.replace(/^0+/, '')
}

const PLACEHOLDER_TITLES = ['Job vacancy (see poster)', 'Job opportunity']
export const isPlaceholderTitle = (t: string) => !t.trim() || PLACEHOLDER_TITLES.includes(t.trim())
/** Job titles worth showing (placeholders such as "Job vacancy (see poster)" are hidden). */
export const postTitles = (post: Post): string => post.positions.map(p => p.title).filter(t => !isPlaceholderTitle(t)).join(' / ')

export type ContactAction = { kind: 'whatsapp' | 'call' | 'email' | 'link' | 'map'; detail: string; href: string }
const https = (u?: string) => (u && /^https:\/\/\S+$/i.test(u.trim()) ? u.trim() : '')

/** Everything a visitor can use to apply: WhatsApp, call, email, apply link and map. */
export function contactActions(post: Post): ContactAction[] {
  const out: ContactAction[] = []
  const titles = postTitles(post)
  const msg = titles ? `Hello, I am interested in the job: ${titles}. Please share more details.` : undefined
  for (const ph of post.phones) {
    const intl = intlNumber(ph, post.countryCode)
    if (!intl) continue
    if (ph.whatsapp) out.push({ kind: 'whatsapp', detail: ph.number, href: whatsappUrl(intl, msg) })
    if (ph.calls) out.push({ kind: 'call', detail: ph.number, href: `tel:+${intl}` })
  }
  for (const em of post.emails) if (/^\S+@\S+\.\S+$/.test(em)) out.push({ kind: 'email', detail: em, href: `mailto:${em}?subject=${encodeURIComponent(titles || 'Job application')}` })
  if (https(post.applyUrl)) out.push({ kind: 'link', detail: https(post.applyUrl), href: https(post.applyUrl) })
  if (https(post.mapsUrl)) out.push({ kind: 'map', detail: '', href: https(post.mapsUrl) })
  return out
}
