declare global {
  // Cloudflare injects this binding automatically in production. During local wrangler
  // development it may be undefined, which causes ReferenceError in serveStatic helpers.
  // eslint-disable-next-line no-var
  var __STATIC_CONTENT_MANIFEST: string | undefined
}

if (typeof globalThis.__STATIC_CONTENT_MANIFEST === 'undefined') {
  globalThis.__STATIC_CONTENT_MANIFEST = JSON.stringify({})
}

export const staticManifest: Record<string, string> | undefined = typeof globalThis.__STATIC_CONTENT_MANIFEST === 'string'
  ? JSON.parse(globalThis.__STATIC_CONTENT_MANIFEST)
  : undefined

export const ensureStaticManifestLoaded = true
