import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { languages, translations, type Lang } from './translations'
import { useContent } from '../context/Content'

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string; dir: 'ltr' | 'rtl' }
const LanguageContext = createContext<Ctx | null>(null)
const STORAGE_KEY = 'jobseekers-lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (saved && languages.some(l => l.code === saved)) return saved
  } catch { /* storage unavailable */ }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const { overrides } = useContent()
  const dir = languages.find(l => l.code === lang)?.dir ?? 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
  }, [])

  // Falls back to English, then to the key itself, so a missing translation never breaks the page.
  const t = useCallback((key: string) => overrides[key]?.[lang] || translations[lang][key] || translations.en[key] || key, [lang, overrides])
  const value = useMemo(() => ({ lang, setLang, t, dir }), [lang, setLang, t, dir])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
