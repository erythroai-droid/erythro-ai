import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  EXPERIMENTAL_TableFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
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
import { PortfolioCategories } from './collections/PortfolioCategories'
import { PortfolioProjects } from './collections/PortfolioProjects'
import { Partners } from './collections/Partners'
import { ContactSubmissions } from './collections/ContactSubmissions'

import { Header } from './globals/Header'
import { Hero } from './globals/Hero'
import { ServicesIntro } from './globals/ServicesIntro'
import { CaseStudies } from './globals/CaseStudies'
import { SolutionsIntro } from './globals/SolutionsIntro'
import { FAQ } from './globals/FAQ'
import { Footer } from './globals/Footer'
import { SiteSettings } from './globals/SiteSettings'
import { LegalPrivacy } from './globals/LegalPrivacy'
import { LegalTerms } from './globals/LegalTerms'
import { LegalAccessibility } from './globals/LegalAccessibility'
import { AuditPage } from './globals/AuditPage'
import { migrations } from './migrations'

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
      beforeDashboard: ['/components/admin/AuditsDashboard#AuditsDashboard'],
      afterNavLinks: [
        '/components/admin/AuditsNavLink#AuditsNavLink',
        '/components/admin/AuditOrdersNavLink#AuditOrdersNavLink',
      ],
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    Services,
    SolutionPlans,
    PortfolioCategories,
    PortfolioProjects,
    Partners,
    ContactSubmissions,
  ],
  globals: [Header, Hero, ServicesIntro, CaseStudies, SolutionsIntro, FAQ, Footer, SiteSettings, LegalPrivacy, LegalTerms, LegalAccessibility, AuditPage],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
  }),
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-key-replace-in-prod',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Never auto-push / introspect against remote DB in CI, tests, or production.
    // Local `next dev` against prod DATABASE_URL writes payload_migrations
    // name=dev / batch=-1, and serverless then hangs on an interactive prompt (PIT-027).
    push:
      process.env.CI === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL === '1' ||
      process.env.PAYLOAD_DISABLE_PUSH === '1'
        ? false
        : undefined,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // Supabase pooler presents a cert chain that fails default Node verify on GHA.
      // Enable only when explicitly requested (CI sets DATABASE_SSL_INSECURE=1).
      ...(process.env.DATABASE_SSL_INSECURE === '1'
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    },
    // prodMigrations runs on every serverless getPayload() init. If batch=-1 exists,
    // Payload prompts on stdin and the function hangs until Cloudflare 524 / Vercel 300s.
    // Migrations already run at build (`payload migrate`). Keep them there only.
    prodMigrations:
      process.env.PAYLOAD_MIGRATING === 'true' ? migrations : undefined,
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
      // Re-uploading the same filename (e.g. replacing a video) otherwise fails
      // on newer @vercel/blob; keep clientUploads for large video files.
      clientUploads: true,
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
