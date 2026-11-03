/** Resize and compress an image so it fits inside a Firestore document. Rejects with a readable message. */
export function compressImage(file: Blob, max: number, mime: 'image/webp' | 'image/jpeg', limit = 450_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'))
    if (file.size > 12 * 1024 * 1024) return reject(new Error('Please choose an image under 12 MB.'))
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
        for (const q of [0.85, 0.7, 0.55, 0.4, 0.3]) { out = canvas.toDataURL(mime, q); if (out.length <= limit) break }
        out.length <= limit ? resolve(out) : reject(new Error('This image is still too large after compression. Choose a smaller one.'))
      }
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}
