const CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ')

export const isCountryCode = (c: string) => CODES.includes(c)

const names = new Map<string, Intl.DisplayNames | null>()
function displayNames(lang: string): Intl.DisplayNames | null {
  if (!names.has(lang)) { try { names.set(lang, new Intl.DisplayNames([lang], { type: 'region' })) } catch { names.set(lang, null) } }
  return names.get(lang) ?? null
}

/** Country name in the visitor's language, from the browser's built-in data (no download). */
export function countryName(code: string, lang: string): string {
  if (!code) return ''
  try { return displayNames(lang)?.of(code) || code } catch { return code }
}
export function countryOptions(lang: string): { code: string; name: string }[] {
  return CODES.map(code => ({ code, name: countryName(code, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang))
}

let enIndex: Record<string, string> | null = null
/** "Kuwait", "kuwait" or "KW" -> "KW". Returns '' when the text is not a country. */
export function countryCodeFromText(text: string): string {
  const v = (text || '').trim()
  if (!v) return ''
  if (CODES.includes(v.toUpperCase())) return v.toUpperCase()
  if (!enIndex) { enIndex = {}; for (const c of CODES) enIndex[countryName(c, 'en').toLowerCase()] = c }
  return enIndex[v.toLowerCase()] ?? ''
}
