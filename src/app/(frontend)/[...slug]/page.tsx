import { notFound } from 'next/navigation'

/** Catch unmatched frontend URLs and render `(frontend)/not-found.tsx`. */
export default function CatchAllNotFound() {
  notFound()
}
