import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  defaultNav, defaultTheme, emptyFooter, sanitizeFooter, sanitizeNav, sanitizeOverrides, sanitizeTheme,
  type FooterSettings, type NavItem, type TextOverrides, type ThemeSettings,
} from '../lib/siteContent'

export type ContentDoc = 'navigation' | 'footer' | 'theme' | 'texts'
type Ctx = {
  nav: NavItem[]; footer: FooterSettings; theme: ThemeSettings; overrides: TextOverrides
  save: (docId: ContentDoc, data: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>
}
const ContentContext = createContext<Ctx | null>(null)
const CACHE = 'jobseekers-content-cache'

type Raw = Partial<Record<ContentDoc, unknown>>
function readCache(): Raw { try { return JSON.parse(localStorage.getItem(CACHE) || '{}') as Raw } catch { return {} } }

/** Site content (menu, footer, theme, text overrides) lives in Firestore under siteSettings/*: public read, admin-only write. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Raw>(readCache)

  useEffect(() => {
    if (!db) return
    const unsubs = (['navigation', 'footer', 'theme', 'texts'] as const).map(id =>
      onSnapshot(doc(db!, 'siteSettings', id), snap => {
        if (!snap.exists()) return
        setRaw(prev => {
          const next = { ...prev, [id]: snap.data() }
          try { localStorage.setItem(CACHE, JSON.stringify(next)) } catch { /* ignore */ }
          return next
        })
      }, () => { /* offline or blocked: keep cached content */ }))
    return () => { unsubs.forEach(u => u()) }
  }, [])

  const save = useCallback(async (docId: ContentDoc, data: Record<string, unknown>) => {
    if (!db) return { ok: false, error: 'Firebase is not configured.' }
    try {
      await setDoc(doc(db, 'siteSettings', docId), { ...data, updatedAt: serverTimestamp() })
      return { ok: true }
    } catch (e) {
      const code = (e as { code?: string }).code
      return { ok: false, error: code === 'permission-denied' ? 'Permission denied. Publish the latest Firestore rules and make sure this account is an admin.' : 'Could not save. Check your connection and try again.' }
    }
  }, [])

  const value = useMemo<Ctx>(() => ({
    nav: sanitizeNav((raw.navigation as { items?: unknown } | undefined)?.items) ?? defaultNav,
    footer: raw.footer ? sanitizeFooter(raw.footer) : emptyFooter,
    theme: raw.theme ? sanitizeTheme(raw.theme) : defaultTheme,
    overrides: sanitizeOverrides((raw.texts as { overrides?: unknown } | undefined)?.overrides),
    save,
  }), [raw, save])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}
