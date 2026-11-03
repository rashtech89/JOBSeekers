import { readZip } from './zip'

/** CSV text -> rows (handles quotes and commas inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++ } else quoted = false } else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',' || c === ';') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && src[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x.trim())) rows.push(row); row = [] }
    else cell += c
  }
  row.push(cell); if (row.some(x => x.trim())) rows.push(row)
  return rows
}

const colIndex = (ref: string) => { let n = 0; for (const ch of ref.replace(/[^A-Z]/gi, '').toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return Math.max(0, n - 1) }

/** First worksheet of an .xlsx file -> rows of text. Reads the file directly, no library. */
export async function readXlsxRows(buf: ArrayBuffer): Promise<string[][]> {
  const entries = await readZip(buf)
  const text = async (name: string) => { const e = entries.find(x => x.name === name); return e ? new TextDecoder().decode(await e.read()) : '' }
  const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml')
  const shared: string[] = []
  const sst = await text('xl/sharedStrings.xml')
  if (sst) parse(sst).querySelectorAll('si').forEach(si => shared.push(Array.from(si.querySelectorAll('t')).map(t => t.textContent ?? '').join('')))
  const sheet = entries.map(e => e.name).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0]
  if (!sheet) throw new Error('No worksheet found in this Excel file.')
  const rows: string[][] = []
  parse(await text(sheet)).querySelectorAll('row').forEach(row => {
    const r: string[] = []
    row.querySelectorAll('c').forEach(c => {
      const type = c.getAttribute('t')
      let v = c.querySelector('v')?.textContent ?? ''
      if (type === 's') v = shared[Number(v)] ?? ''
      else if (type === 'inlineStr') v = c.querySelector('is t')?.textContent ?? ''
      r[colIndex(c.getAttribute('r') || 'A')] = v
    })
    const full = Array.from(r, x => x ?? '')
    if (full.some(x => x.trim())) rows.push(full)
  })
  return rows
}
