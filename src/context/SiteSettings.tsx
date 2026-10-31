import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Settings live in Firestore (siteSettings/main): everyone can read, only admins can write (see firestore.rules).
// localStorage is only a fast first-paint cache and the fallback when Firebase is not configured (local development).
export type BrandingSettings = {
  siteName: string
  tagline: string
  primaryColor: string
  headerCover: string
  logo: string
  footerDescription: string
}

export const defaultSettings: BrandingSettings = {
  siteName: 'Job Seekers',
  tagline: 'YOUR NEXT OPPORTUNITY',
  primaryColor: '#07584e',
  headerCover: '',
  logo: '',
  footerDescription: 'Discover opportunities. Build your future.',
}
const KEYS = Object.keys(defaultSettings) as (keyof BrandingSettings)[]
const CACHE_KEY = 'jobseekers-branding-settings'

function pick(raw: unknown): BrandingSettings {
  const out = { ...defaultSettings }
  if (raw && typeof raw === 'object') {
    for (const k of KEYS) {
      const v = (raw as Record<string, unknown>)[k]
      if (typeof v === 'string') out[k] = v
    }
  }
  return out
}
function readCache(): BrandingSettings {
  try { const s = localStorage.getItem(CACHE_KEY); return s ? pick(JSON.parse(s)) : defaultSettings } catch { return defaultSettings }
}
function writeCache(s: BrandingSettings) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)) } catch { /* ignore */ } }

type Ctx = { settings: BrandingSettings; save: (next: BrandingSettings) => Promise<{ ok: boolean; error?: string }> }
const SiteSettingsContext = createContext<Ctx | null>(null)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings>(readCache)

  useEffect(() => {
    document.documentElement.style.setProperty('--green', settings.primaryColor)
    document.title = `${settings.siteName} | ${settings.tagline}`
  }, [settings])

  useEffect(() => {
    if (!db) return
    return onSnapshot(doc(db, 'siteSettings', 'main'), snap => {
      if (!snap.exists()) return
      const next = pick(snap.data())
      setSettings(next); writeCache(next)
    }, () => { /* offline or blocked: keep the cached settings */ })
  }, [])

  const save = useCallback(async (next: BrandingSettings) => {
    if (!db) { setSettings(next); writeCache(next); return { ok: true } }
    try {
      await setDoc(doc(db, 'siteSettings', 'main'), { ...next, updatedAt: serverTimestamp() })
      setSettings(next); writeCache(next)
      return { ok: true }
    } catch (e) {
      const code = (e as { code?: string }).code
      return { ok: false, error: code === 'permission-denied' ? 'Permission denied. Only an admin account can save settings.' : 'Could not save. Check your connection and try again.' }
    }
  }, [])

  const value = useMemo(() => ({ settings, save }), [settings, save])
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) throw new Error('useSiteSettings must be used inside SiteSettingsProvider')
  return ctx
}
