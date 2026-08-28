// Load .env files
import 'dotenv/config'
import { vi } from 'vitest'

// Mock next/cache so unstable_cache executes functions directly during tests
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

