import { after, NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  resolveNotifyRecipients,
  sendClientAcknowledgement,
  sendContactNotification,
  type SiteEmailSettings,
} from '@/lib/contactNotification'
import {
  consumeContactRateLimit,
  getRequestIp,
  type RateLimitResult,
} from '@/lib/contactRateLimit'
import { isContactHoneypotTriggered } from '@/lib/contactHoneypot'
import { guardContactSubmission } from '@/lib/contactSubmissionGuard'
import { triggerAuditAgent } from '@/lib/auditAgentTrigger'
import { checkFreeAuditCooldown, isAuditIntakeLimitsDisabled } from '@/lib/auditRateLimit'
import {
  readTurnstileToken,
  turnstileActionFromBody,
  verifyTurnstileToken,
} from '@/lib/turnstile'

export const runtime = 'nodejs'

/**
 * Isolated contact intake:
 * rate-limit → honeypot → Turnstile siteverify → sanitize/validate
 * → Payload CMS → SMTP staff notify → SMTP client ack → (audit) trigger VPS worker /api/run-audit.
 * Frontend must POST JSON here only (no direct CMS writes from the browser).
 */
export async function POST(request: NextRequest) {
  const ip = getRequestIp(request)
  const skipIntakeLimits = isAuditIntakeLimitsDisabled()
  let limited: RateLimitResult | undefined
  if (!skipIntakeLimits) {
    limited = consumeContactRateLimit(`contact:${ip}`)
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
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  if (isContactHoneypotTriggered(body)) {
    // Silent accept — do not persist, notify, or reveal the trap to bots.
    console.warn('[api/contact] honeypot drop')
    return NextResponse.json({ ok: true })
  }

  const turnstile = await verifyTurnstileToken({
    token: readTurnstileToken(body),
    action: turnstileActionFromBody(body),
    remoteip: ip === 'unknown' ? undefined : ip,
  })
  if (!turnstile.ok) {
    return NextResponse.json({ message: turnstile.message }, { status: turnstile.status })
  }

  const guarded = guardContactSubmission(body)
  if (!guarded.ok) {
    return NextResponse.json({ message: guarded.message }, { status: guarded.status })
  }

  const {
    name,
    email,
    phone,
    message,
    locale,
    source,
    website,
    auditLanguage,
    planSlug,
    planTotal,
    auditStatus,
  } = guarded.data

  try {
    const payload = await getPayload({ config })

    // Free audit rate limit: 1 domain per user per 5 days (off while QA skip is on)
    if (!skipIntakeLimits && source === 'audit' && (!planSlug || planSlug === 'audit-free')) {
      const cooldown = await checkFreeAuditCooldown(payload, {
        website: website || '',
        email: email || '',
        ip,
        locale: locale || auditLanguage,
      })

      if (!cooldown.allowed) {
        return NextResponse.json(
          {
            ok: false,
            message: cooldown.message,
            reason: cooldown.reason,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(cooldown.retryAfterSec),
              'X-RateLimit-Limit': '1',
              'X-RateLimit-Remaining': '0',
            },
          },
        )
      }
    }

    const created = await payload.create({
      collection: 'contact-submissions',
      data: {
        name,
        email,
        phone,
        message,
        locale,
        source,
        ip,
        ...(website ? { website } : {}),
        ...(auditLanguage ? { auditLanguage } : {}),
        ...(planSlug ? { planSlug } : {}),
        ...(planTotal ? { planTotal } : {}),
        ...(source === 'audit' ? { auditStatus: auditStatus || 'new' } : {}),
      },
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
      website,
      auditLanguage,
      planSlug,
      planTotal,
      ...(source === 'audit' ? { submissionId: created.id } : {}),
    })
    if (!mailed.sent) {
      console.error('[api/contact] saved submission but email was not sent:', mailed.reason)
    }

    const acked = await sendClientAcknowledgement({ name, email, locale })
    if (!acked.sent) {
      console.error('[api/contact] saved submission but client acknowledgement was not sent:', acked.reason)
    }

    let auditQueued: boolean | undefined
    if (source === 'audit' && website) {
      const triggerInput = {
        submissionId: created.id,
        targetUrl: website,
        locale: auditLanguage || locale || undefined,
        planSlug: planSlug || undefined,
        clientEmail: email || undefined,
        clientName: name || undefined,
      }
      const triggered = await triggerAuditAgent(triggerInput, { attempts: 1 })
      auditQueued = triggered.ok
      if (!triggered.ok) {
        console.error('[api/contact] audit worker not queued:', triggered.reason)
        after(async () => {
          const retry = await triggerAuditAgent(triggerInput, { attempts: 2 })
          if (retry.ok) {
            console.info('[api/contact] background audit requeue ok id=', created.id)
            return
          }
          console.error(
            '[api/contact] background audit requeue failed:',
            retry.reason,
            'id=',
            created.id,
          )
        })
      }
    }

    return NextResponse.json(
      {
        ok: true,
        ...(source === 'audit'
          ? {
              submissionId: created.id,
              orderId: `AUD-${created.id}`,
              auditQueued: Boolean(auditQueued),
            }
          : {}),
      },
      {
        headers: limited
          ? {
              'X-RateLimit-Limit': String(limited.limit),
              'X-RateLimit-Remaining': String(limited.remaining),
            }
          : undefined,
      },
    )
  } catch (err) {
    console.error('[api/contact] Failed to save submission:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
