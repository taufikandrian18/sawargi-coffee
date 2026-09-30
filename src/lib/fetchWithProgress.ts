/**
 * Download a file while reporting real progress (0–100), from the response's
 * Content-Length. Without a length or a streamable body it still downloads,
 * and reports 100 at the end.
 */
export async function fetchWithProgress(
  url: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<Blob> {
  const response = await fetchImpl(url, { signal })
  if (!response.ok) throw new Error(`${url} responded ${response.status}`)

  const type = response.headers.get('content-type') ?? ''
  const total = Number(response.headers.get('content-length')) || 0
  if (!response.body || !total) {
    const blob = await response.blob()
    onProgress(100)
    return blob
  }

  const reader = response.body.getReader()
  const chunks: BlobPart[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    // Hold at 99 until the stream actually ends.
    onProgress(Math.min(99, Math.floor((loaded / total) * 100)))
  }
  onProgress(100)
  return new Blob(chunks, { type })
}
