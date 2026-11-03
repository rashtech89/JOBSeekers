/** Minimal ZIP reader (stored + deflate) that needs no library. */
export type ZipEntry = { name: string; read: () => Promise<Uint8Array> }

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function readZip(buf: ArrayBuffer): Promise<ZipEntry[]> {
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  if (eocd < 0) throw new Error('This is not a valid ZIP file.')
  const total = view.getUint16(eocd + 10, true)
  let p = view.getUint32(eocd + 16, true)
  const out: ZipEntry[] = []
  for (let n = 0; n < total; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break
    const method = view.getUint16(p + 10, true)
    const csize = view.getUint32(p + 20, true)
    const nameLen = view.getUint16(p + 28, true), extraLen = view.getUint16(p + 30, true), commentLen = view.getUint16(p + 32, true)
    const localOffset = view.getUint32(p + 42, true)
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen))
    p += 46 + nameLen + extraLen + commentLen
    if (name.endsWith('/')) continue
    out.push({
      name,
      read: async () => {
        const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true)
        const data = bytes.subarray(start, start + csize)
        if (method === 0) return data
        if (method === 8) return inflateRaw(data)
        throw new Error('This ZIP uses an unsupported compression method.')
      },
    })
  }
  return out
}
