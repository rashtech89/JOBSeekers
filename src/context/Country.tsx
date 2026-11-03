import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { isCountryCode } from '../lib/countries'

type Ctx = { country: string; setCountry: (code: string) => void }
const CountryContext = createContext<Ctx | null>(null)
const KEY = 'jobseekers-country'

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setState] = useState(() => { try { const c = localStorage.getItem(KEY) || ''; return isCountryCode(c) ? c : '' } catch { return '' } })
  const setCountry = useCallback((code: string) => { setState(code); try { localStorage.setItem(KEY, code) } catch { /* ignore */ } }, [])
  const value = useMemo(() => ({ country, setCountry }), [country, setCountry])
  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
}
export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used inside CountryProvider')
  return ctx
}
