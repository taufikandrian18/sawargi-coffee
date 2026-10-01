/**
 * Journal articles written in WordPress (Posts → Add New), read through the
 * standard REST API. Post HTML is cleaned against an allowlist before it is
 * rendered, so a pasted script or iframe never reaches the page.
 */

export type JournalPost = {
  slug: string
  title: string
  /** ISO date the post was published (site time). */
  date: string
  excerpt: string
  /** Sanitised article HTML. */
  html: string
  readingMinutes: number
}

type WpPost = {
  slug: string
  date: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
}

const FIELDS = 'slug,date,title,excerpt,content'

function postsUrl(storeUrl: string, params: Record<string, string>) {
  const base = storeUrl.replace(/\/+$/, '')
  return `${base}/wp-json/wp/v2/posts?${new URLSearchParams({ ...params, _fields: FIELDS }).toString()}`
}

async function fetchPosts(url: string, fetchImpl: typeof fetch) {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Journal responded ${response.status}`)
  const posts = (await response.json()) as unknown
  if (!Array.isArray(posts)) throw new Error('Journal returned an unexpected shape')
  return posts.filter(isWpPost).map(toJournalPost)
}

/** Newest published posts, for the journal index. */
export function fetchJournalPosts(storeUrl: string, fetchImpl: typeof fetch = fetch) {
  return fetchPosts(postsUrl(storeUrl, { per_page: '20' }), fetchImpl)
}

/** One post by slug, or null when WordPress has none published under it. */
export async function fetchJournalPost(storeUrl: string, slug: string, fetchImpl: typeof fetch = fetch) {
  const posts = await fetchPosts(postsUrl(storeUrl, { slug }), fetchImpl)
  return posts[0] ?? null
}

function isWpPost(value: unknown): value is WpPost {
  const post = value as WpPost
  return (
    !!post &&
    typeof post.slug === 'string' &&
    typeof post.date === 'string' &&
    typeof post.title?.rendered === 'string' &&
    typeof post.excerpt?.rendered === 'string' &&
    typeof post.content?.rendered === 'string'
  )
}

function toJournalPost(post: WpPost): JournalPost {
  const html = sanitizePostHtml(post.content.rendered)
  const words = htmlToText(html).split(/\s+/).filter(Boolean).length
  return {
    slug: post.slug,
    title: htmlToText(post.title.rendered),
    date: post.date,
    excerpt: htmlToText(post.excerpt.rendered).replace(/\s*\[(…|&hellip;|\.\.\.)\]\s*$/, '…'),
    html,
    readingMinutes: Math.max(1, Math.round(words / 220))
  }
}

/** Text content of an HTML fragment, entities decoded (WordPress titles arrive as HTML). */
export function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Tags kept as they are; anything else is unwrapped (its text stays) unless it is in DROP. */
const ALLOWED: Record<string, string[]> = {
  p: [],
  br: [],
  hr: [],
  h2: ['id'],
  h3: ['id'],
  h4: ['id'],
  ul: [],
  ol: ['start'],
  li: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  blockquote: [],
  figure: [],
  figcaption: [],
  img: ['src', 'alt', 'width', 'height'],
  a: ['href'],
  sup: ['id'],
  sub: [],
  code: [],
  pre: []
}

/** Removed together with everything inside them. */
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'noscript', 'template', 'svg', 'math', 'link', 'meta', 'video', 'audio', 'canvas'])

function safeUrl(value: string, kind: 'link' | 'image') {
  const url = value.trim()
  if (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) return url
  if (kind === 'link' && (url.startsWith('#') || /^mailto:/i.test(url))) return url
  return null
}

/**
 * Rebuilds post HTML from allowlisted tags and attributes only. Dependency-free
 * on purpose (see CLAUDE.md: ask before adding packages); DOMParser does not
 * run scripts or load images while parsing.
 */
export function sanitizePostHtml(html: string) {
  const source = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const out = document.implementation.createHTMLDocument('')
  const root = out.createElement('div')

  const copy = (from: Node, into: Node) => {
    from.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        into.appendChild(out.createTextNode(node.textContent ?? ''))
        return
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return
      const element = node as Element
      const tag = element.tagName.toLowerCase()
      if (DROP.has(tag)) return
      const attributes = ALLOWED[tag]
      if (!attributes) {
        copy(element, into)
        return
      }
      const clean = out.createElement(tag)
      for (const name of attributes) {
        const value = element.getAttribute(name)
        if (value === null) continue
        if (name === 'href' || name === 'src') {
          const url = safeUrl(value, name === 'src' ? 'image' : 'link')
          if (url) clean.setAttribute(name, url)
        } else if (name === 'width' || name === 'height' || name === 'start') {
          if (/^\d+$/.test(value)) clean.setAttribute(name, value)
        } else {
          clean.setAttribute(name, value)
        }
      }
      if (tag === 'a' && /^https?:\/\//i.test(clean.getAttribute('href') ?? '')) {
        clean.setAttribute('target', '_blank')
        clean.setAttribute('rel', 'noopener noreferrer')
      }
      if (tag === 'img') {
        if (!clean.hasAttribute('src')) return
        clean.setAttribute('loading', 'lazy')
        clean.setAttribute('decoding', 'async')
        if (!clean.hasAttribute('alt')) clean.setAttribute('alt', '')
      }
      copy(element, clean)
      into.appendChild(clean)
    })
  }

  copy(source.body, root)
  return root.innerHTML
}

/** "1 October 2026", the way the static article prints its date. */
export function formatJournalDate(iso: string) {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
