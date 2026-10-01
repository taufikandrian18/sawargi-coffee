import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CatalogProvider } from '../lib/catalog'
import { JournalIndexPage, WordPressArticlePage } from './JournalPage'

const STORE = 'https://shop.example.com/sawargi-coffee/shop'
const catalogFetch = vi.fn(async () => new Response('[]', { headers: { 'content-type': 'application/json' } }))
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })

const post = (slug: string, date: string, title: string) => ({
  slug,
  date,
  title: { rendered: title },
  excerpt: { rendered: `<p>About ${title}</p>` },
  content: { rendered: '<h2>Beds</h2><p>Raised beds dry faster.<script>alert(1)</script></p>' }
})

function withStore(ui: React.ReactNode, storeUrl = STORE) {
  return render(
    <CatalogProvider storeUrl={storeUrl} fetchImpl={catalogFetch as unknown as typeof fetch}>
      {ui}
    </CatalogProvider>
  )
}

afterEach(() => window.history.replaceState(null, '', '/'))

describe('journal index', () => {
  it('lists WordPress articles with the static one, newest first', async () => {
    const fetchImpl = vi.fn(async () =>
      json([post('on-drying', '2026-10-01T09:00:00', 'On drying'), post('old-notes', '2026-09-01T09:00:00', 'Old notes')])
    )
    withStore(<JournalIndexPage fetchImpl={fetchImpl as unknown as typeof fetch} />)
    await screen.findByText('On drying')
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(['On drying', 'Dried in the Fruit', 'Old notes'])
    expect(screen.getByText('On drying').closest('a')?.getAttribute('href')).toBe('/journal/on-drying')
  })

  it('keeps the static article when the shop is unreachable or absent', async () => {
    const failing = vi.fn(async () => {
      throw new Error('offline')
    })
    withStore(<JournalIndexPage fetchImpl={failing as unknown as typeof fetch} />)
    await waitFor(() => expect(failing).toHaveBeenCalled())
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Dried in the Fruit'])
  })
})

describe('WordPress article page', () => {
  it('renders the sanitised post', async () => {
    const fetchImpl = vi.fn(async () => json([post('on-drying', '2026-10-01T09:00:00', 'On drying')]))
    const { container } = withStore(<WordPressArticlePage slug="on-drying" fetchImpl={fetchImpl as unknown as typeof fetch} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'On drying' })).toBeTruthy()
    expect(screen.getByText(/1 October 2026 · 1 min read/)).toBeTruthy()
    const prose = container.querySelector('.journal-prose') as HTMLElement
    expect(within(prose).getByRole('heading', { level: 2, name: 'Beds' })).toBeTruthy()
    expect(prose.querySelector('script')).toBeNull()
    expect(screen.getByText('Choose a batch')).toBeTruthy()
  })

  it('says so when the slug has no published post', async () => {
    const fetchImpl = vi.fn(async () => json([]))
    withStore(<WordPressArticlePage slug="nope" fetchImpl={fetchImpl as unknown as typeof fetch} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Article not found' })).toBeTruthy()
  })

  it('says not found without a shop', () => {
    withStore(<WordPressArticlePage slug="nope" />, '')
    expect(screen.getByRole('heading', { level: 1, name: 'Article not found' })).toBeTruthy()
  })
})
