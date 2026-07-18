import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Services } from './collections/Services'
import { SolutionPlans } from './collections/SolutionPlans'
import { PortfolioProjects } from './collections/PortfolioProjects'
import { Partners } from './collections/Partners'
import { ContactSubmissions } from './collections/ContactSubmissions'

import { Header } from './globals/Header'
import { Hero } from './globals/Hero'
import { ServicesIntro } from './globals/ServicesIntro'
import { CaseStudies } from './globals/CaseStudies'
import { SolutionsIntro } from './globals/SolutionsIntro'
import { Footer } from './globals/Footer'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    // Allow users to pick light/dark (default). Toggle also in the header via ThemeToggle.
    theme: 'all',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      actions: ['/components/admin/ThemeToggle#ThemeToggle'],
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    Services,
    SolutionPlans,
    PortfolioProjects,
    Partners,
    ContactSubmissions,
  ],
  globals: [Header, Hero, ServicesIntro, CaseStudies, SolutionsIntro, Footer, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-key-replace-in-prod',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Русский', code: 'ru' },
      { label: 'עברית', code: 'he', rtl: true },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // Vercel Functions reject request bodies > ~4.5 MB. Client uploads go
      // straight to Blob from the browser and bypass that limit (needed for video).
      clientUploads: true,
      // Re-uploading the same filename (e.g. replacing a video) otherwise fails.
      allowOverwrite: true,
      collections: {
        media: {
          // Serve media straight from the public Blob URL instead of proxying
          // through Payload's `/api/media/file/...` route. The proxy route
          // returns range requests as `200` (instead of `206 Partial Content`)
          // once cached by Vercel, which breaks <video> playback/seeking. The
          // direct Blob URL supports proper range requests. Media is public
          // (`read: () => true`), so dropping Payload access control is safe.
          disablePayloadAccessControl: true,
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
