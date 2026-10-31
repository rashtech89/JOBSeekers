import { useEffect } from 'react'
import { useContent } from './Content'
import { useSiteSettings } from './SiteSettings'
import { findTheme } from '../lib/themes'

/** Applies the selected whole-site theme (colours, font, card and corner style) to the page. Renders nothing. */
export default function ThemeEngine() {
  const { theme } = useContent()
  const { settings } = useSiteSettings()
  useEffect(() => {
    const preset = findTheme(theme.themeId)
    const root = document.documentElement
    const vars: Record<string, string> = { ...preset.vars }
    if (theme.brandOverride && settings.primaryColor) vars['--green'] = settings.primaryColor
    const keys = Object.keys(vars)
    keys.forEach(k => root.style.setProperty(k, vars[k]))
    root.dataset.cards = preset.cards
    root.dataset.radius = preset.radius
    root.style.fontFamily = preset.font ?? ''
    return () => { keys.forEach(k => root.style.removeProperty(k)); root.style.fontFamily = '' }
  }, [theme.themeId, theme.brandOverride, settings.primaryColor])
  return null
}
