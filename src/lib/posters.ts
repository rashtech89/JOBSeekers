import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

// Poster pictures live in jobImages/<id>. Each one is fetched once and remembered.
const cache = new Map<string, Promise<string>>()
export function loadPoster(id: string): Promise<string> {
  const hit = cache.get(id)
  if (hit) return hit
  const p = (async () => {
    if (!db || !id) return ''
    try { return String(((await getDoc(doc(db, 'jobImages', id))).data() as { data?: string } | undefined)?.data ?? '') } catch { cache.delete(id); return '' }
  })()
  cache.set(id, p)
  return p
}
