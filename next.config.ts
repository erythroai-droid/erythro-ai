import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * Public CSP: no 'unsafe-eval' in production (audit remediation). Inline scripts
 * (GA/Turnstile/Next) still need 'unsafe-inline' until a nonce pipeline ships.
 * `next dev` webpack uses eval-source-map — without 'unsafe-eval' client chunks
 * (e.g. SplashScreen) never hydrate and the SSR splash plate sticks forever.
 * Admin keeps a looser policy — Payload UI needs eval/inline.
 */
const isDev = process.env.NODE_ENV === 'development'
const SCRIPT_SRC_EVAL = isDev ? " 'unsafe-eval'" : ''

const PUBLIC_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${SCRIPT_SRC_EVAL} blob: https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src https://challenges.cloudflare.com",
  "child-src https://challenges.cloudflare.com blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com https://*.public.blob.vercel-storage.com https://*.r2.dev https://challenges.cloudflare.com https://cloudflareinsights.com",
  "media-src 'self' blob: https:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const ADMIN_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src https://challenges.cloudflare.com",
  "child-src https://challenges.cloudflare.com blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com https://*.public.blob.vercel-storage.com https://*.r2.dev https://challenges.cloudflare.com https://cloudflareinsights.com",
  "media-src 'self' blob: https:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/** Sample A44 HTML reports load Inter from Google Fonts + inline copy/filter scripts. */
const SAMPLE_REPORT_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self' mailto: tel:",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
] as const

/** Sitekey is public. Cloudflare dashboard often names it TURNSTILE_SITE_KEY. */
const turnstileSiteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || ''

const nextConfig: NextConfig = {
  // Canonical is https://erythro.ai (no trailing slash). Inner `/about/` → 308 `/about`.
  // The HTTP homepage path is always `/`; do not 308 `/` to an empty path.
  trailingSlash: false,
  // Stop advertising stack via X-Powered-By (Next.js; Payload may still append — strip in middleware).
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: turnstileSiteKey,
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          ...SECURITY_HEADERS,
          { key: 'Content-Security-Policy', value: ADMIN_CONTENT_SECURITY_POLICY },
        ],
      },
      {
        source: '/samples/audit/:path*',
        headers: [
          ...SECURITY_HEADERS,
          { key: 'Content-Security-Policy', value: SAMPLE_REPORT_CONTENT_SECURITY_POLICY },
        ],
      },
      {
        source: '/((?!admin|samples/audit).*)',
        headers: [
          ...SECURITY_HEADERS,
          { key: 'Content-Security-Policy', value: PUBLIC_CONTENT_SECURITY_POLICY },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
  // Tailwind CSS is small (~27 KiB). Inlining removes render-blocking <link>
  // round-trips that PSI estimates at ~1 s on Slow 4G (FCP/LCP).
  // Trade-off: CSS rides with HTML (no separate cache) — fine for atomic CSS.
  experimental: {
    inlineCss: true,
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/images/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // Custom media domain (set R2_MEDIA_PUBLIC_BASE_URL / NEXT_PUBLIC_R2_MEDIA_BASE_URL)
      ...(process.env.NEXT_PUBLIC_R2_MEDIA_HOST
        ? [
            {
              protocol: 'https' as const,
              hostname: process.env.NEXT_PUBLIC_R2_MEDIA_HOST.replace(/^https?:\/\//, '').split('/')[0]!,
            },
          ]
        : []),
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (webpackConfig, { isServer, webpack }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    if (!isServer) {
      // The Vercel Blob client upload handler (referenced from the admin
      // importMap) imports `getFileKey` from the plugin-cloud-storage
      // `utilities` barrel. That barrel also re-exports the server-only
      // `resolveSignedURLKey`, which pulls the full Payload server bundle
      // (-> undici -> `node:*` builtins) into the browser and breaks the
      // client build with UnhandledSchemeError. It never runs client-side, so
      // replace it with a no-op stub in the client bundle.
      webpackConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]resolveSignedURLKey(\.js)?$/,
          path.resolve(dirname, 'src/stubs/resolve-signed-url-key.client.js'),
        ),
      )
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
