import { useMemo } from 'react'
import { Globe2 } from 'lucide-react'
import { useCountry } from '../context/Country'
import { useLang } from '../i18n/LanguageContext'
import { countryOptions } from '../lib/countries'

export default function CountrySelect() {
  const { country, setCountry } = useCountry()
  const { lang, t } = useLang()
  const options = useMemo(() => countryOptions(lang), [lang])
  return <label className="language-select country-select"><Globe2 size={16}/>
    <select value={country} onChange={e => setCountry(e.target.value)} aria-label={t('country.label')}>
      <option value="">{t('country.all')}</option>
      {options.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
    </select></label>
}
