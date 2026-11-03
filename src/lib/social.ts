export type AccountType = 'seeker' | 'employer' | 'hr'
export type Visibility = 'members' | 'public' | 'private'
export type Experience = { title: string; company: string; from: string; to: string; description: string }
export type Education = { school: string; degree: string; from: string; to: string }
export type Profile = {
  displayName: string; headline: string; location: string; countryCode: string; about: string; accountType: AccountType
  photo: string; cover: string; skills: string[]; experience: Experience[]; education: Education[]
  certificates: string[]; languages: string[]; openToWork: boolean; visibility: Visibility
}

export const pairId = (a: string, b: string) => [a, b].sort().join('_')
export const emptyProfile = (name: string, type: AccountType = 'seeker'): Profile => ({
  displayName: name, headline: '', location: '', countryCode: '', about: '', accountType: type, photo: '', cover: '',
  skills: [], experience: [], education: [], certificates: [], languages: [], openToWork: false, visibility: 'members',
})

const s = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '')
const list = (v: unknown, max = 40) => (Array.isArray(v) ? v.slice(0, max) : [])
const strList = (v: unknown, max = 40, len = 80) => list(v, max).filter((x): x is string => typeof x === 'string').map(x => x.slice(0, len))

export function sanitizeProfile(raw: unknown, fallbackName = ''): Profile {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const type = (['seeker', 'employer', 'hr'] as string[]).includes(d.accountType as string) ? (d.accountType as AccountType) : 'seeker'
  const vis = (['members', 'public', 'private'] as string[]).includes(d.visibility as string) ? (d.visibility as Visibility) : 'members'
  return {
    displayName: s(d.displayName, 80) || fallbackName, headline: s(d.headline, 200), location: s(d.location, 100), countryCode: s(d.countryCode, 2),
    about: s(d.about, 2600), accountType: type, photo: s(d.photo, 80000), cover: s(d.cover, 250000),
    skills: strList(d.skills), certificates: strList(d.certificates, 30, 150), languages: strList(d.languages, 20, 60),
    experience: list(d.experience, 20).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { title: s(o.title, 100), company: s(o.company, 100), from: s(o.from, 30), to: s(o.to, 30), description: s(o.description, 600) } }),
    education: list(d.education, 20).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { school: s(o.school, 120), degree: s(o.degree, 120), from: s(o.from, 30), to: s(o.to, 30) } }),
    openToWork: d.openToWork === true, visibility: vis,
  }
}

export const initials = (name: string) => (name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?')
export const typeLabel = (t: AccountType) => (t === 'employer' ? 'Employer' : t === 'hr' ? 'HR / Recruiter' : 'Job seeker')
export const toDate = (v: unknown): Date => ((v as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date())
