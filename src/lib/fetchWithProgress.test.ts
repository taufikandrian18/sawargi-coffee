import { describe, expect, it, vi } from 'vitest'
import { fetchWithProgress } from './fetchWithProgress'

const streamOf = (...chunks: number[]) => {
  let i = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(new Uint8Array(chunks[i++]))
      else controller.close()
    }
  })
}

describe('fetchWithProgress', () => {
  it('reports real progress from Content-Length and holds 99 until the stream ends', async () => {
    const seen: number[] = []
    const fetchImpl = vi.fn(
      async () => new Response(streamOf(25, 25, 50), { headers: { 'content-length': '100', 'content-type': 'video/mp4' } })
    )
    const blob = await fetchWithProgress('/v.mp4', (p) => seen.push(p), undefined, fetchImpl)
    expect(seen).toEqual([25, 50, 99, 100])
    expect(blob.size).toBe(100)
    expect(blob.type).toBe('video/mp4')
  })

  it('reports each whole percent once, however many chunks arrive', async () => {
    const seen: number[] = []
    const chunks = Array.from({ length: 1000 }, () => 1)
    const fetchImpl = vi.fn(async () => new Response(streamOf(...chunks), { headers: { 'content-length': '1000' } }))
    await fetchWithProgress('/v.mp4', (p) => seen.push(p), undefined, fetchImpl)
    expect(seen.length).toBeLessThanOrEqual(101)
    expect(new Set(seen).size).toBe(seen.length)
    expect(seen.at(-1)).toBe(100)
  })

  it('still downloads without a Content-Length, reporting 100 at the end', async () => {
    const seen: number[] = []
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array(7)))
    const blob = await fetchWithProgress('/v.mp4', (p) => seen.push(p), undefined, fetchImpl)
    expect(seen).toEqual([100])
    expect(blob.size).toBe(7)
  })

  it('rejects on an HTTP error so the caller can fall back', async () => {
    const fetchImpl = vi.fn(async () => new Response('x', { status: 404 }))
    await expect(fetchWithProgress('/v.mp4', () => undefined, undefined, fetchImpl)).rejects.toThrow('404')
  })
})
