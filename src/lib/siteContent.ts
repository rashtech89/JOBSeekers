import type { Lang } from '../i18n/translations'

/** Menu item. `labelKey` points to a built-in translation; `label` holds the owner's own per-language text. */
export type NavItem = {
  id: string; to: string; group: string
  labelKey?: string; label?: Partial<Record<Lang, string>>
  enabled: boolean; header: boolean; menu: boolean; footer: boolean
}

const item = (id: string, to: string, group: string, labelKey: string, header: boolean, menu: boolean, footer: boolean): NavItem =>
  ({ id, to, group, labelKey, enabled: true, header, menu, footer })

export const defaultNav: NavItem[] = [
  item('home', '/', 'main', 'nav.home', false, true, false),
  item('jobs', '/jobs', 'main', 'nav.jobs', true, true, true),
  item('cv', '/cv-builder', 'main', 'nav.cv', true, true, true),
  item('companies', '/companies', 'explore', 'nav.companies', true, true, true),
  item('employers', '/employer', 'employers', 'nav.employers', true, true, false),
  item('post', '/employer/upload', 'employers', 'nav.post', false, true, true),
  item('login', '/login', 'account', 'nav.login', false, true, false),
  item('register', '/register', 'account', 'nav.register', false, true, false),
  item('contact', '/contact', 'support', 'nav.contact', false, true, true),
  item('help', '/help', 'support', 'nav.help', false, true, true),
  item('safety', '/safety', 'support', 'nav.safety', false, true, true),
  item('privacy', '/privacy', 'legal', 'nav.privacy', false, true, true),
  item('terms', '/terms', 'legal', 'nav.terms', false, true, true),
  item('cookies', '/cookies', 'legal', 'nav.cookies', false, true, true),
]

export type FooterSettings = {
  email: string; phone: string; whatsapp: string; address: string
  facebook: string; instagram: string; tiktok: string; youtube: string; linkedin: string; x: string; telegram: string
  playStore: string; appStore: string
}
export const footerFields = ['email', 'phone', 'whatsapp', 'address', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'telegram', 'playStore', 'appStore'] as const
export const emptyFooter: FooterSettings = {
  email: '', phone: '', whatsapp: '', address: '', facebook: '', instagram: '', tiktok: '', youtube: '', linkedin: '', x: '', telegram: '', playStore: '', appStore: '',
}

export type ThemeSettings = { themeId: string; brandOverride: boolean }
export const defaultTheme: ThemeSettings = { themeId: 'classic', brandOverride: false }

export type TextOverrides = Record<string, Partial<Record<Lang, string>>>

/** Only internal paths and https / mailto / tel links are allowed. Anything else (e.g. javascript:) becomes empty. */
export function safeHref(url: string): string {
  const u = url.trim()
  if (!u) return ''
  if (u.startsWith('/') && !u.startsWith('//')) return u
  if (/^https:\/\/[^\s]+$/i.test(u) || /^mailto:[^\s]+$/i.test(u) || /^tel:[^\s]+$/i.test(u)) return u
  return ''
}
export const isExternal = (to: string) => /^(https:|mailto:|tel:)/i.test(to)

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '')
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)

export function sanitizeNav(raw: unknown): NavItem[] | null {
  if (!Array.isArray(raw)) return null
  const out: NavItem[] = []
  for (const r of raw.slice(0, 40)) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    const id = str(o.id, 40); const to = safeHref(str(o.to, 300))
    if (!id || !to) continue
    const labels = o.label && typeof o.label === 'object' ? (o.label as Record<string, unknown>) : {}
    out.push({
      id, to, group: str(o.group, 30) || 'main', labelKey: str(o.labelKey, 60) || undefined,
      label: { en: str(labels.en, 80), bn: str(labels.bn, 80), ar: str(labels.ar, 80) },
      enabled: bool(o.enabled, true), header: bool(o.header, false), menu: bool(o.menu, true), footer: bool(o.footer, false),
    })
  }
  return out.length ? out : null
}
export function sanitizeFooter(raw: unknown): FooterSettings {
  const out = { ...emptyFooter }
  if (raw && typeof raw === 'object') for (const k of footerFields) out[k] = str((raw as Record<string, unknown>)[k])
  return out
}
export function sanitizeTheme(raw: unknown): ThemeSettings {
  if (!raw || typeof raw !== 'object') return defaultTheme
  const o = raw as Record<string, unknown>
  return { themeId: str(o.themeId, 30) || 'classic', brandOverride: bool(o.brandOverride, false) }
}
export function sanitizeOverrides(raw: unknown): TextOverrides {
  const out: TextOverrides = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, val] of Object.entries(raw as Record<string, unknown>).slice(0, 500)) {
    if (!val || typeof val !== 'object') continue
    const v = val as Record<string, unknown>
    const entry: Partial<Record<Lang, string>> = {}
    for (const l of ['en', 'bn', 'ar'] as const) { const s = str(v[l], 600); if (s) entry[l] = s }
    if (Object.keys(entry).length) out[key] = entry
  }
  return out
}
