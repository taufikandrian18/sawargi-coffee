import { describe, expect, it, vi } from 'vitest'
import { fetchJournalPost, fetchJournalPosts, formatJournalDate, htmlToText, sanitizePostHtml } from './journal'

const STORE = 'https://shop.example.com/sawargi-coffee/shop/'

const wpPost = (slug: string, date: string, content = '<p>Some words here.</p>') => ({
  slug,
  date,
  title: { rendered: 'Drying &#8216;in the fruit&#8217;' },
  excerpt: { rendered: '<p>How the drying goes [&hellip;]</p>\n' },
  content: { rendered: content }
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('journal posts from WordPress', () => {
  it('asks the REST API for the fields it renders', async () => {
    const fetchImpl = vi.fn(async () => json([wpPost('on-drying', '2026-10-01T09:00:00')]))
    const [post] = await fetchJournalPosts(STORE, fetchImpl as unknown as typeof fetch)
    const url = new URL(fetchImpl.mock.calls[0][0] as unknown as string)
    expect(url.origin + url.pathname).toBe('https://shop.example.com/sawargi-coffee/shop/wp-json/wp/v2/posts')
    expect(url.searchParams.get('_fields')).toBe('slug,date,title,excerpt,content')
    expect(post).toMatchObject({ slug: 'on-drying', title: 'Drying ‘in the fruit’', excerpt: 'How the drying goes…', readingMinutes: 1 })
  })

  it('looks a post up by slug, and returns null when there is none', async () => {
    const fetchImpl = vi.fn(async () => json([]))
    expect(await fetchJournalPost(STORE, 'gone', fetchImpl as unknown as typeof fetch)).toBeNull()
    expect(new URL(fetchImpl.mock.calls[0][0] as unknown as string).searchParams.get('slug')).toBe('gone')
  })

  it('rejects errors and odd shapes, and skips malformed posts', async () => {
    await expect(fetchJournalPosts(STORE, (async () => json({}, 500)) as unknown as typeof fetch)).rejects.toThrow('500')
    await expect(fetchJournalPosts(STORE, (async () => json({ code: 'x' })) as unknown as typeof fetch)).rejects.toThrow('shape')
    const posts = await fetchJournalPosts(STORE, (async () => json([{ slug: 'x' }, wpPost('ok', '2026-10-01T09:00:00')])) as unknown as typeof fetch)
    expect(posts.map((p) => p.slug)).toEqual(['ok'])
  })

  it('estimates reading time from the words', async () => {
    const long = `<p>${'word '.repeat(1100)}</p>`
    const [post] = await fetchJournalPosts(STORE, (async () => json([wpPost('long', '2026-10-01T09:00:00', long)])) as unknown as typeof fetch)
    expect(post.readingMinutes).toBe(5)
  })

  it('prints dates like the static article', () => {
    expect(formatJournalDate('2026-09-29')).toBe('29 September 2026')
    expect(formatJournalDate('2026-10-01T09:00:00')).toBe('1 October 2026')
    expect(formatJournalDate('nonsense')).toBe('')
  })
})

describe('sanitizePostHtml', () => {
  it('keeps the article markup WordPress produces', () => {
    const html =
      '<h2 class="wp-block-heading">Drying</h2><p>A <strong>natural</strong> <em>coffee</em>.<sup>1</sup></p>' +
      '<figure class="wp-block-image"><img src="https://shop.example.com/a.webp" alt="Cherries" width="800" height="600" class="x"/><figcaption>Beds</figcaption></figure>' +
      '<ul><li>one</li></ul><ol start="3"><li>three</li></ol><blockquote><p>Quote</p></blockquote>'
    const clean = sanitizePostHtml(html)
    expect(clean).toContain('<h2>Drying</h2>')
    expect(clean).toContain('<p>A <strong>natural</strong> <em>coffee</em>.<sup>1</sup></p>')
    expect(clean).toContain('<img src="https://shop.example.com/a.webp" alt="Cherries" width="800" height="600" loading="lazy" decoding="async">')
    expect(clean).toContain('<ol start="3">')
    expect(clean).not.toContain('class=')
    expect(sanitizePostHtml('<img src="/shop/wp-content/uploads/a.webp" alt="">')).toBe(
      '<img src="/shop/wp-content/uploads/a.webp" alt="" loading="lazy" decoding="async">'
    )
  })

  it('removes scripts, handlers, frames and unsafe URLs', () => {
    const clean = sanitizePostHtml(
      '<p onclick="steal()">Hi<script>alert(1)</script></p><iframe src="https://evil.example"></iframe>' +
        '<a href="javascript:alert(1)">bad</a><a href=" JaVaScRiPt:alert(1)">bad2</a><a href="//evil.example">bad3</a><img src="x" onerror="alert(1)">' +
        '<img src="data:image/svg+xml,<svg onload=alert(1)>"><style>body{display:none}</style><svg><script>1</script></svg>'
    )
    expect(clean).toBe('<p>Hi</p><a>bad</a><a>bad2</a><a>bad3</a>')
  })

  it('opens outside links safely and keeps in-page and site links', () => {
    const clean = sanitizePostHtml('<a href="https://doi.org/x">doi</a><a href="#ref-1">1</a><a href="/sawargi-coffee/checkout">buy</a>')
    expect(clean).toBe(
      '<a href="https://doi.org/x" target="_blank" rel="noopener noreferrer">doi</a><a href="#ref-1">1</a><a href="/sawargi-coffee/checkout">buy</a>'
    )
  })

  it('unwraps unknown tags but keeps their text', () => {
    expect(sanitizePostHtml('<div class="wp-block-group"><span style="color:red">kept</span></div>')).toBe('kept')
    expect(htmlToText('Tom &amp; Jerry&#8217;s')).toBe('Tom & Jerry’s')
  })
})
