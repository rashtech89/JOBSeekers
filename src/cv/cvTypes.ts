import type { Lang } from '../i18n/translations'

export type CvTemplate = 'europass' | 'modern'

export type CvData = {
  cvLang: Lang
  template: CvTemplate
  photo: string // compressed data URL, or ''
  fullName: string
  headline: string
  email: string
  phone: string
  address: string
  nationality: string
  birthDate: string
  links: string
  summary: string
  experience: { company: string; role: string; location: string; from: string; to: string; current: boolean; description: string }[]
  education: { school: string; degree: string; from: string; to: string }[]
  skills: string // comma or line separated
  languages: { name: string; level: string }[]
  certificates: { name: string; issuer: string; year: string }[]
  references: { name: string; role: string; contact: string }[]
}

export type SavedCv = { id: string; name: string; updatedAt: string; data: CvData }

export const emptyCv = (lang: Lang): CvData => ({
  cvLang: lang, template: 'europass', photo: '', fullName: '', headline: '', email: '', phone: '', address: '',
  nationality: '', birthDate: '', links: '', summary: '',
  experience: [{ company: '', role: '', location: '', from: '', to: '', current: false, description: '' }],
  education: [{ school: '', degree: '', from: '', to: '' }],
  skills: '', languages: [{ name: '', level: 'intermediate' }],
  certificates: [], references: [],
})

export const LEVELS = ['basic', 'intermediate', 'advanced', 'native'] as const

export const skillList = (s: string) => s.split(/[,\n،]/).map(x => x.trim()).filter(Boolean)
