const DAY = 86_400_000
export function relativeTime(iso: string, lang: string): string {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / DAY)
  try {
    return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(Math.min(days, 0), 'day')
  } catch { return iso }
}
