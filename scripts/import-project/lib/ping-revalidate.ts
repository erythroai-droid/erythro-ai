/** Bust Vercel Data Cache after a local Payload write (hooks cannot revalidateTag off-request). */

export async function pingSiteRevalidate(paths: string[]): Promise<void> {
  const token = process.env.REVALIDATION_TOKEN?.trim()
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    'https://erythro.ai'
  ).replace(/\/$/, '')

  if (!token) {
    console.warn(
      'REVALIDATION_TOKEN missing — site cache was not busted. Save the doc once in production admin, or POST /api/revalidate?secret=…&path=/portfolio/<slug>',
    )
    return
  }

  for (const path of paths) {
    const url = `${origin}/api/revalidate?secret=${encodeURIComponent(token)}&path=${encodeURIComponent(path)}`
    const res = await fetch(url, { method: 'POST' })
    const body = await res.text()
    if (!res.ok) {
      console.warn(`Revalidate ${path} failed (${res.status}): ${body.slice(0, 200)}`)
      continue
    }
    console.log(`  ✓ revalidated ${path}`)
  }
}
