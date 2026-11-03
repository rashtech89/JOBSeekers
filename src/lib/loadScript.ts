// Heavy helpers (ZIP, PDF, Excel) are loaded only when the admin uses them, from cdnjs, so they never slow down the public site.
const cache = new Map<string, Promise<void>>()
export function loadScript(src: string): Promise<void> {
  const hit = cache.get(src)
  if (hit) return hit
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src; el.async = true
    el.onload = () => resolve()
    el.onerror = () => { cache.delete(src); reject(new Error('Could not load a helper library. Check your internet connection.')) }
    document.head.appendChild(el)
  })
  cache.set(src, p)
  return p
}
export const CDN = {
  jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
}
