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
  let reported = -1
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    // Hold at 99 until the stream actually ends. Report only when the whole
    // percent changes: a large file arrives in thousands of chunks, and each
    // report re-renders the loader.
    const percent = Math.min(99, Math.floor((loaded / total) * 100))
    if (percent !== reported) {
      reported = percent
      onProgress(percent)
    }
  }
  onProgress(100)
  return new Blob(chunks, { type })
}
