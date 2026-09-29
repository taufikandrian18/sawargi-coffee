import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { createReadStream, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'

const hlsMimeHeaders = (): Plugin => {
  const serveHlsAsset = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname

    if (pathname.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
      next()
      return
    }

    if (/^\/media\/[^/]+\/[^/]+\.ts$/.test(pathname)) {
      const filePath = fileURLToPath(new URL(`./public${pathname}`, import.meta.url))
      const stat = statSync(filePath)

      res.statusCode = 200
      res.setHeader('Content-Type', 'video/mp2t')
      res.setHeader('Content-Length', String(stat.size))

      if (req.method === 'HEAD') {
        res.end()
        return
      }

      createReadStream(filePath).pipe(res)
      return
    }

    next()
  }

  return {
    name: 'hls-mime-headers',
    configureServer(server) {
      server.middlewares.use(serveHlsAsset)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveHlsAsset)
    }
  }
}

/**
 * Where the site is served from. '/' by default; deploy/build-site.sh sets
 * SITE_BASE_PATH (e.g. /sawargi-coffee) when the site lives under a path.
 */
const base = `/${(process.env.SITE_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/')

export default defineConfig({
  base,
  plugins: [react(), hlsMimeHeaders()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: true
  }
})
