import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  resolveNotifyRecipients,
  sendContactNotification,
  type SiteEmailSettings,
} from '@/lib/contactNotification'
import {
  consumeContactRateLimit,
  getRequestIp,
} from '@/lib/contactRateLimit'
import { guardContactSubmission } from '@/lib/contactSubmissionGuard'

export const runtime = 'nodejs'

/**
 * Isolated contact intake:
 * rate-limit → sanitize/validate → Payload CMS → SMTP notify.
 * Frontend must POST JSON here only (no direct CMS writes from the browser).
 */
export async function POST(request: NextRequest) {
  const ip = getRequestIp(request)
  const limited = consumeContactRateLimit(`contact:${ip}`)
  if (!limited.ok) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limited.retryAfterSec),
          'X-RateLimit-Limit': String(limited.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const guarded = guardContactSubmission(body)
  if (!guarded.ok) {
    return NextResponse.json({ message: guarded.message }, { status: guarded.status })
  }

  const { name, email, phone, message, locale, source } = guarded.data

  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'contact-submissions',
      data: { name, email, phone, message, locale, source },
    })

    const settings = (await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })) as SiteEmailSettings

    const notifyTo = resolveNotifyRecipients(settings, source)
    const mailed = await sendContactNotification(notifyTo, {
      name,
      email,
      phone,
      message,
      locale,
      source,
    })
    if (!mailed.sent) {
      console.error('[api/contact] saved submission but email was not sent:', mailed.reason)
    }

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'X-RateLimit-Limit': String(limited.limit),
          'X-RateLimit-Remaining': String(limited.remaining),
        },
      },
    )
  } catch (err) {
    console.error('[api/contact] Failed to save submission:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
