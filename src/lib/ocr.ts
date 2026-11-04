import { loadScript } from './loadScript'
import { extractContacts, type Detected } from './extract'

// Free reading tools are loaded from jsDelivr (pinned versions) only when an admin asks for detection.
const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'
const JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'

type Worker = { recognize: (img: string) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> }
type TesseractGlobal = { createWorker: (langs: string, oem: number, opts: { logger: (m: { status: string; progress: number }) => void }) => Promise<Worker> }
declare global {
  interface Window { Tesseract?: TesseractGlobal; jsQR?: (d: Uint8ClampedArray, w: number, h: number) => { data: string } | null }
}

let worker: Promise<Worker> | null = null
let onStatus: ((s: string) => void) | undefined
async function getWorker(): Promise<Worker> {
  if (!worker) worker = (async () => {
    await loadScript(TESSERACT)
    if (!window.Tesseract) throw new Error('The reading tool could not be loaded.')
    return window.Tesseract.createWorker('eng+ara', 1, { logger: m => { if (m.status) onStatus?.(`Reading poster: ${m.status} ${Math.round((m.progress || 0) * 100)}%`) } })
  })().catch(e => { worker = null; throw e })
  return worker
}
/** Frees the memory used by the reading tool. Call after a batch. */
export async function stopOcr() { const w = worker; worker = null; if (w) { try { await (await w).terminate() } catch { /* ignore */ } } }

function readQr(dataUrl: string): Promise<string[]> {
  return new Promise(resolve => {
    const img = new Image()
    img.onerror = () => resolve([])
    img.onload = async () => {
      try {
        await loadScript(JSQR)
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
        const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
        const ctx = c.getContext('2d'); if (!ctx || !window.jsQR) return resolve([])
        ctx.drawImage(img, 0, 0, c.width, c.height)
        const px = ctx.getImageData(0, 0, c.width, c.height)
        const code = window.jsQR(px.data, c.width, c.height)
        resolve(code?.data ? [code.data] : [])
      } catch { resolve([]) }
    }
    img.src = dataUrl
  })
}

// One poster at a time, so many pictures never open many heavy workers.
let chain: Promise<unknown> = Promise.resolve()
export function detectPosterContacts(dataUrl: string, countryCode?: string, status?: (s: string) => void): Promise<Detected> {
  const run = async (): Promise<Detected> => {
    onStatus = status
    const qr = await readQr(dataUrl)
    let text = ''
    try { text = (await (await getWorker()).recognize(dataUrl)).data.text } catch (e) { if (qr.length === 0) throw new Error((e as Error).message || 'Could not read the poster.') }
    return extractContacts(text, countryCode, qr)
  }
  const p = chain.then(run, run)
  chain = p.catch(() => undefined)
  return p
}
