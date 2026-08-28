// Load .env files
import 'dotenv/config'
import { vi } from 'vitest'

// Mock next/cache so unstable_cache executes functions directly during tests
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

// Without DATABASE_URL (Unit CI job) Payload still dials localhost:5432 and leaves
// unhandled pool rejections that fail the run. Fail fast instead so CMS helpers
// take their static fallbacks.
vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  if (process.env.DATABASE_URL?.trim()) return actual

  return {
    ...actual,
    getPayload: async () => {
      throw new Error('DATABASE_URL is not set — Payload is disabled in this test run')
    },
  }
})
