import { compressImage } from '../../lib/images'
import { readZip } from '../../lib/zip'
import { parseCsv, readXlsxRows } from '../../lib/tables'
import { CDN, loadScript } from '../../lib/loadScript'

/** One poster picture ready to store (already resized and compressed). */
export type PosterImage = { name: string; data: string }
/** One job read from a spreadsheet row. */
export type SheetJob = {
  company: string; countryCode: string; city: string; title: string; category: string; requirements: string[]
  phone: string; dialCode: string; whatsapp: boolean; calls: boolean; email: string; mapsUrl: string; applyUrl: string; howToApply: string; status: string
}

export const TEMPLATE_HEADERS = ['company', 'countryCode', 'city', 'title', 'category', 'requirements', 'phone', 'dialCode', 'whatsapp', 'calls', 'email', 'mapsUrl', 'applyUrl', 'howToApply', 'status']
export const TEMPLATE_CSV = `${TEMPLATE_HEADERS.join(',')}\nGulf Eastern Group,KW,Kuwait City,Secretary,Administration,"Experience in office work; Good English",92222536,965,yes,no,,,,"Send your CV on WhatsApp",published\n`

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i
const POSTER_MAX = 1100
const POSTER_LIMIT = 330_000

const mimeOf = (name: string) => (/\.png$/i.test(name) ? 'image/png' : /\.webp$/i.test(name) ? 'image/webp' : 'image/jpeg')

async function posterFrom(blob: Blob, name: string): Promise<PosterImage> {
  return { name, data: await compressImage(blob, POSTER_MAX, 'image/jpeg', POSTER_LIMIT) }
}

type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } }> }> }
}

/** Turns every picked file into poster images. Spreadsheets are returned separately as job rows. */
export async function readFiles(files: File[], onProgress: (msg: string) => void, maxPdfPages = 12): Promise<{ images: PosterImage[]; rows: SheetJob[]; skipped: string[] }> {
  const images: PosterImage[] = []
  const rows: SheetJob[] = []
  const skipped: string[] = []
  for (const file of files) {
    const name = file.name
    try {
      onProgress(`Reading ${name}…`)
      if (IMAGE_EXT.test(name) || file.type.startsWith('image/')) {
        images.push(await posterFrom(file, name))
      } else if (/\.zip$/i.test(name)) {
        const entries = (await readZip(await file.arrayBuffer())).filter(e => IMAGE_EXT.test(e.name) && !e.name.includes('__MACOSX'))
        if (entries.length === 0) skipped.push(`${name}: no images found inside`)
        for (const e of entries) {
          onProgress(`Reading ${name} / ${e.name}…`)
          const bytes = await e.read()
          images.push(await posterFrom(new Blob([bytes as BlobPart], { type: mimeOf(e.name) }), e.name.split('/').pop() || e.name))
        }
      } else if (/\.pdf$/i.test(name)) {
        await loadScript(CDN.pdf)
        const pdfjs = (window as unknown as { pdfjsLib: PdfJs }).pdfjsLib
        pdfjs.GlobalWorkerOptions.workerSrc = CDN.pdfWorker
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
        const pages = Math.min(pdf.numPages, maxPdfPages)
        for (let p = 1; p <= pages; p++) {
          onProgress(`Reading ${name}: page ${p} of ${pages}…`)
          const page = await pdf.getPage(p)
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: Math.min(2, 1400 / Math.max(base.width, base.height)) })
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height)
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas is not available in this browser.')
          await page.render({ canvasContext: ctx, viewport }).promise
          const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.9))
          if (!blob) throw new Error('Could not render this PDF page.')
          images.push(await posterFrom(blob, `${name.replace(/\.pdf$/i, '')}-p${p}.jpg`))
        }
        if (pdf.numPages > pages) skipped.push(`${name}: only the first ${pages} pages were read`)
      } else if (/\.(csv|txt)$/i.test(name)) {
        rows.push(...rowsToJobs(parseCsv(await file.text())))
      } else if (/\.xlsx$/i.test(name)) {
        rows.push(...rowsToJobs(await readXlsxRows(await file.arrayBuffer())))
      } else if (/\.xls$/i.test(name)) {
        skipped.push(`${name}: old .xls files are not supported. Save it as .xlsx or .csv and upload again`)
      } else {
        skipped.push(`${name}: unsupported file type`)
      }
    } catch (e) { skipped.push(`${name}: ${(e as Error).message}`) }
  }
  return { images, rows, skipped }
}

const yes = (v: string) => /^(y|yes|true|1)$/i.test(v.trim())

export function rowsToJobs(table: string[][]): SheetJob[] {
  if (table.length < 2) return []
  const head = table[0].map(h => h.trim().toLowerCase())
  const col = (row: string[], name: string) => (row[head.indexOf(name.toLowerCase())] ?? '').trim()
  return table.slice(1).filter(r => r.some(c => c.trim())).slice(0, 500).map(r => ({
    company: col(r, 'company'), countryCode: col(r, 'countryCode').toUpperCase().slice(0, 2), city: col(r, 'city'),
    title: col(r, 'title') || 'Job opportunity', category: col(r, 'category') || 'General',
    requirements: col(r, 'requirements').split(/[;\n]/).map(s => s.trim()).filter(Boolean),
    phone: col(r, 'phone'), dialCode: col(r, 'dialCode').replace(/\D/g, ''), whatsapp: yes(col(r, 'whatsapp')), calls: yes(col(r, 'calls')),
    email: col(r, 'email'), mapsUrl: col(r, 'mapsUrl'), applyUrl: col(r, 'applyUrl'), howToApply: col(r, 'howToApply'), status: col(r, 'status') || 'draft',
  }))
}
