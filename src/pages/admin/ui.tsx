import { useState } from 'react'

export function AField({ label, value, onChange, type = 'text', area = false, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; area?: boolean; placeholder?: string; hint?: string
}) {
  return <label className="cv-field"><span>{label}</span>
    {area ? <textarea rows={5} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      : <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
    {hint && <small>{hint}</small>}
  </label>
}

/** One status line (saved / error) shared by every admin tab. */
export function useStatus() {
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null)
  return { status, ok: (text: string) => setStatus({ text, ok: true }), fail: (text: string) => setStatus({ text, ok: false }), clear: () => setStatus(null) }
}
export const StatusLine = ({ status }: { status: { text: string; ok: boolean } | null }) =>
  status ? <p className={status.ok ? 'small-note' : 'notice auth-error'} role="status">{status.text}</p> : null

/** Resize + compress so images fit inside a Firestore document (1 MiB limit). Rejects with a readable message. */
export function compressImage(file: File, max: number, mime: 'image/webp' | 'image/jpeg', limit = 450_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'))
    if (file.size > 8 * 1024 * 1024) return reject(new Error('Please choose an image under 8 MB.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('This image could not be opened.'))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale))
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        let out = ''
        for (const q of [0.85, 0.7, 0.55, 0.4]) { out = canvas.toDataURL(mime, q); if (out.length <= limit) break }
        out.length <= limit ? resolve(out) : reject(new Error('This image is still too large after compression. Choose a smaller one.'))
      }
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}
