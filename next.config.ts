import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
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
