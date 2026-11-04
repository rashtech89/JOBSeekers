import { KNOWN_DIAL_CODES, dialCodeFor } from './contacts'

export type DetectedPhone = { number: string; dialCode: string; whatsapp: boolean; calls: boolean }
export type Detected = { phones: DetectedPhone[]; emails: string[]; mapsUrl: string; applyUrl: string }

const AR = '٠١٢٣٤٥٦٧٨٩'
const FA = '۰۱۲۳۴۵۶۷۸۹'
/** Arabic-Indic and Persian digits become 0-9. */
export const normalizeDigits = (s: string) => s.replace(/[٠-٩]/g, d => String(AR.indexOf(d))).replace(/[۰-۹]/g, d => String(FA.indexOf(d)))
const uniq = <T,>(a: T[]) => Array.from(new Set(a))
const MAPS = /google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.apple\.com/i

function splitIntl(digits: string): { dialCode: string; number: string } {
  const code = KNOWN_DIAL_CODES.find(c => digits.startsWith(c) && digits.length - c.length >= 6)
  return code ? { dialCode: code, number: digits.slice(code.length) } : { dialCode: '', number: digits }
}

/** Finds phone numbers, emails and links in text read from a poster (OCR) and in QR codes. Results are suggestions only. */
export function extractContacts(rawText: string, countryCode?: string, qrValues: string[] = []): Detected {
  let text = normalizeDigits(rawText)
  const emails = uniq((text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g) ?? []).map(e => e.toLowerCase()))
  const links = (text.match(/https?:\/\/[^\s)>\]]+/g) ?? []).map(l => l.replace(/[.,;]+$/, ''))
  const phones: DetectedPhone[] = []
  const add = (p: DetectedPhone) => { if (!phones.some(x => x.number === p.number && x.dialCode === p.dialCode)) phones.push(p) }

  for (const q of qrValues.map(v => v.trim())) {
    if (/^https?:\/\//i.test(q)) {
      const wa = q.match(/wa\.me\/(\d{7,15})/i) ?? q.match(/[?&]phone=(\d{7,15})/i)
      if (wa) { const s = splitIntl(wa[1]); add({ ...s, whatsapp: true, calls: false }) } else links.push(q)
    } else if (/^mailto:/i.test(q)) emails.push(q.slice(7).split('?')[0].toLowerCase())
    else if (/^tel:/i.test(q)) { const s = splitIntl(q.replace(/\D/g, '')); add({ ...s, whatsapp: false, calls: true }) }
  }

  // Do not read numbers that are part of an email or a link.
  text = text.replace(/[A-Za-z0-9._%+-]+@\S+/g, ' ').replace(/https?:\/\/\S+/g, ' ')
  const noCalls = /no\s*calls?|messages?\s*only|whats\s*app\s*(messages?\s*)?only|رسائل\s*فقط|بدون\s*اتصال|دون\s*اتصال/i.test(text)
  for (const m of text.matchAll(/(\+|00)?\s*\(?\d[\d\s().-]{6,17}\d/g)) {
    const raw = m[0].trim()
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) continue
    const around = text.slice(Math.max(0, (m.index ?? 0) - 60), (m.index ?? 0) + m[0].length + 60).toLowerCase()
    const wa = /whats\s*app|واتس|wa\.me/.test(around) || noCalls
    const intl = raw.startsWith('+') || raw.startsWith('00')
    const split = intl ? splitIntl(raw.startsWith('00') ? digits.slice(2) : digits) : { dialCode: dialCodeFor(countryCode), number: digits.replace(/^0+/, '') }
    add({ ...split, whatsapp: wa, calls: !noCalls })
  }

  const all = uniq(links)
  return {
    phones: phones.slice(0, 4), emails: uniq(emails).slice(0, 4),
    mapsUrl: all.find(l => MAPS.test(l)) ?? '',
    applyUrl: all.find(l => !MAPS.test(l) && !/wa\.me/i.test(l)) ?? '',
  }
}
