/**
 * Where the site is mounted: '' at a domain root, or e.g. '/sawargi-coffee'
 * when built with SITE_BASE_PATH (vite.config.ts). Routes inside the app are
 * always written from '/'; these helpers add and remove the prefix.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '')

export const withBase = (to: string) => (to.startsWith('/') ? `${BASE}${to}` : to)

export function stripBase(pathname: string) {
  if (!BASE) return pathname
  if (pathname === BASE) return '/'
  return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname
}

/** URL of a file in public/, e.g. asset('/media/stills/step-1.webp'). */
export const asset = (path: string) => `${BASE}/${path.replace(/^\/+/, '')}`
