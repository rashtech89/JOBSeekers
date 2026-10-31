import { Info } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  const { t } = useLang()
  return <p className={compact ? 'disclaimer disclaimer-compact' : 'disclaimer'} role="note"><Info size={16} aria-hidden="true"/><span>{t('disclaimer.text')}</span></p>
}
